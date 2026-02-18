import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { pilotAvailability } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { availabilitySchema, bulkAvailabilitySchema } from "@/modules/scheduling/schemas/scheduling-schemas";

function extractPilotId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const idIndex = segments.findIndex((s) => s === "pilots") + 1;
  const id = parseInt(segments[idIndex]);
  return isNaN(id) ? null : id;
}

/**
 * GET /api/scheduling/pilots/[id]/availability
 * Get all availability records for a pilot
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const pilotId = extractPilotId(req);
  if (!pilotId) return errorResponse("Invalid pilot ID");

  try {
    const availability = await db
      .select()
      .from(pilotAvailability)
      .where(eq(pilotAvailability.pilotId, pilotId))
      .orderBy(pilotAvailability.dayOfWeek);

    return successResponse({ availability });
  } catch (error) {
    console.error("[Scheduling API] Get availability error:", error);
    return errorResponse("Failed to fetch availability", 500);
  }
});

/**
 * POST /api/scheduling/pilots/[id]/availability
 * Create or update availability for a pilot
 * Accepts single availability or bulk (array)
 */
export const POST = withAuth(async (_user, req: NextRequest) => {
  const pilotId = extractPilotId(req);
  if (!pilotId) return errorResponse("Invalid pilot ID");

  try {
    const body = await req.json();

    // Check if bulk or single
    if (Array.isArray(body.availabilities)) {
      // Bulk update
      const parsed = bulkAvailabilitySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.issues[0].message);
      }

      const results = [];
      for (const avail of parsed.data.availabilities) {
        // Check if record exists
        const existing = await db
          .select()
          .from(pilotAvailability)
          .where(
            and(
              eq(pilotAvailability.pilotId, pilotId),
              eq(pilotAvailability.dayOfWeek, avail.dayOfWeek)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update
          await db
            .update(pilotAvailability)
            .set({
              startTime: avail.startTime,
              endTime: avail.endTime,
              isAvailable: avail.isAvailable,
              notes: avail.notes || null,
              updatedAt: new Date(),
            })
            .where(eq(pilotAvailability.id, existing[0].id));
          results.push({ dayOfWeek: avail.dayOfWeek, action: "updated" });
        } else {
          // Insert
          await db.insert(pilotAvailability).values({
            pilotId,
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isAvailable: avail.isAvailable,
            notes: avail.notes || null,
          });
          results.push({ dayOfWeek: avail.dayOfWeek, action: "created" });
        }
      }

      return successResponse({ message: "Availability updated", results });
    } else {
      // Single update
      const parsed = availabilitySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.issues[0].message);
      }

      const { dayOfWeek, startTime, endTime, isAvailable, notes } = parsed.data;

      // Check if record exists
      const existing = await db
        .select()
        .from(pilotAvailability)
        .where(
          and(
            eq(pilotAvailability.pilotId, pilotId),
            eq(pilotAvailability.dayOfWeek, dayOfWeek)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update
        await db
          .update(pilotAvailability)
          .set({
            startTime,
            endTime,
            isAvailable,
            notes: notes || null,
            updatedAt: new Date(),
          })
          .where(eq(pilotAvailability.id, existing[0].id));

        return successResponse({ message: "Availability updated", id: existing[0].id });
      } else {
        // Insert
        const [result] = await db.insert(pilotAvailability).values({
          pilotId,
          dayOfWeek,
          startTime,
          endTime,
          isAvailable,
          notes: notes || null,
        });

        return successResponse({ message: "Availability created", id: result.insertId });
      }
    }
  } catch (error) {
    console.error("[Scheduling API] Update availability error:", error);
    return errorResponse("Failed to update availability", 500);
  }
});

/**
 * DELETE /api/scheduling/pilots/[id]/availability?dayOfWeek=X
 * Delete a specific day's availability
 */
export const DELETE = withAuth(async (_user, req: NextRequest) => {
  const pilotId = extractPilotId(req);
  if (!pilotId) return errorResponse("Invalid pilot ID");

  const searchParams = req.nextUrl.searchParams;
  const dayOfWeek = parseInt(searchParams.get("dayOfWeek") || "");

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return errorResponse("Invalid dayOfWeek parameter (0-6)");
  }

  try {
    await db
      .delete(pilotAvailability)
      .where(
        and(
          eq(pilotAvailability.pilotId, pilotId),
          eq(pilotAvailability.dayOfWeek, dayOfWeek)
        )
      );

    return successResponse({ message: "Availability deleted", dayOfWeek });
  } catch (error) {
    console.error("[Scheduling API] Delete availability error:", error);
    return errorResponse("Failed to delete availability", 500);
  }
});
