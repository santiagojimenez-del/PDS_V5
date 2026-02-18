import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { pilotBlackout } from "@/lib/db/schema";
import { eq, gte } from "drizzle-orm";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { blackoutSchema } from "@/modules/scheduling/schemas/scheduling-schemas";

function extractPilotId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const idIndex = segments.findIndex((s) => s === "pilots") + 1;
  const id = parseInt(segments[idIndex]);
  return isNaN(id) ? null : id;
}

/**
 * GET /api/scheduling/pilots/[id]/blackout
 * Get all blackout dates for a pilot
 * Optional query param: ?future=true (only future blackouts)
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const pilotId = extractPilotId(req);
  if (!pilotId) return errorResponse("Invalid pilot ID");

  const searchParams = req.nextUrl.searchParams;
  const futureOnly = searchParams.get("future") === "true";

  try {
    let query = db
      .select()
      .from(pilotBlackout)
      .where(eq(pilotBlackout.pilotId, pilotId));

    if (futureOnly) {
      const now = new Date();
      query = query.where(gte(pilotBlackout.endDate, now)) as typeof query;
    }

    const blackouts = await query.orderBy(pilotBlackout.startDate);

    return successResponse({ blackouts });
  } catch (error) {
    console.error("[Scheduling API] Get blackout error:", error);
    return errorResponse("Failed to fetch blackout dates", 500);
  }
});

/**
 * POST /api/scheduling/pilots/[id]/blackout
 * Create a new blackout period
 */
export const POST = withAuth(async (_user, req: NextRequest) => {
  const pilotId = extractPilotId(req);
  if (!pilotId) return errorResponse("Invalid pilot ID");

  try {
    const body = await req.json();
    const parsed = blackoutSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { startDate, endDate, reason } = parsed.data;

    const [result] = await db.insert(pilotBlackout).values({
      pilotId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || null,
    });

    return successResponse({
      message: "Blackout period created",
      id: result.insertId,
    });
  } catch (error) {
    console.error("[Scheduling API] Create blackout error:", error);
    return errorResponse("Failed to create blackout period", 500);
  }
});

/**
 * DELETE /api/scheduling/pilots/[id]/blackout/[blackoutId]
 * Delete a specific blackout period
 */
export const DELETE = withAuth(async (_user, req: NextRequest) => {
  const pilotId = extractPilotId(req);
  if (!pilotId) return errorResponse("Invalid pilot ID");

  const segments = new URL(req.url).pathname.split("/");
  const blackoutId = parseInt(segments[segments.length - 1]);

  if (isNaN(blackoutId)) {
    return errorResponse("Invalid blackout ID");
  }

  try {
    // Verify ownership before deleting
    const existing = await db
      .select()
      .from(pilotBlackout)
      .where(eq(pilotBlackout.id, blackoutId))
      .limit(1);

    if (existing.length === 0) {
      return notFoundResponse("Blackout period not found");
    }

    if (existing[0].pilotId !== pilotId) {
      return errorResponse("Unauthorized", 403);
    }

    await db.delete(pilotBlackout).where(eq(pilotBlackout.id, blackoutId));

    return successResponse({ message: "Blackout period deleted", id: blackoutId });
  } catch (error) {
    console.error("[Scheduling API] Delete blackout error:", error);
    return errorResponse("Failed to delete blackout period", 500);
  }
});
