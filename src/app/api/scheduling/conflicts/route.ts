import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { conflictCheckSchema } from "@/modules/scheduling/schemas/scheduling-schemas";
import { detectScheduleConflicts } from "@/modules/scheduling/services/conflict-detector";

/**
 * POST /api/scheduling/conflicts
 * Check for scheduling conflicts for a pilot on a specific date
 *
 * Body: { pilotId: number, scheduledDate: string, durationHours?: number }
 */
export const POST = withAuth(async (_user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = conflictCheckSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { pilotId, scheduledDate, durationHours } = parsed.data;

    const conflictReport = await detectScheduleConflicts(
      pilotId,
      scheduledDate,
      durationHours
    );

    return successResponse({
      pilotId,
      scheduledDate,
      ...conflictReport,
    });
  } catch (error) {
    console.error("[Scheduling API] Conflict check error:", error);
    return errorResponse("Failed to check conflicts", 500);
  }
});
