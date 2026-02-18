import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { assignmentSuggestionSchema } from "@/modules/scheduling/schemas/scheduling-schemas";
import { suggestOptimalPilots } from "@/modules/scheduling/services/assignment-optimizer";

/**
 * POST /api/scheduling/suggest
 * Get optimal pilot suggestions for a job
 *
 * Body: { scheduledDate: string, requiredCount?: number, durationHours?: number }
 */
export const POST = withAuth(async (_user, req: NextRequest) => {
  try {
    const body = await req.json();

    // Extract scheduledDate and other params
    const { scheduledDate, requiredCount, durationHours } = body;

    if (!scheduledDate) {
      return errorResponse("scheduledDate is required");
    }

    const suggestions = await suggestOptimalPilots(
      scheduledDate,
      requiredCount || 1,
      durationHours || 4
    );

    return successResponse({
      scheduledDate,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error("[Scheduling API] Suggest pilots error:", error);
    return errorResponse("Failed to get pilot suggestions", 500);
  }
});
