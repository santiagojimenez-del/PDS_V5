import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { generateOccurrences } from "@/modules/recurring/services/occurrence-generator";
import { getTemplateById } from "@/modules/recurring/services/recurring-service";

/**
 * POST /api/recurring/[id]/generate
 * Manually generate occurrences for a template
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_user) => {
    try {
      const { id } = await context.params;
      const templateId = parseInt(id, 10);

      if (isNaN(templateId)) {
        return errorResponse("Invalid template ID", 400);
      }

      // Check if template exists
      const template = await getTemplateById(templateId);
      if (!template) {
        return notFoundResponse("Template not found");
      }

      // Parse optional body parameters
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      let maxCount: number = 100;

      try {
        const body = await req.json();
        if (body.fromDate) fromDate = new Date(body.fromDate);
        if (body.toDate) toDate = new Date(body.toDate);
        if (body.maxCount) maxCount = parseInt(body.maxCount, 10);
      } catch {
        // No body or invalid JSON - use defaults
      }

      // Generate occurrences
      const result = await generateOccurrences(
        templateId,
        fromDate,
        toDate,
        maxCount
      );

      return successResponse({
        generated: result.generated,
        skipped: result.skipped,
        total: result.occurrences.length,
        occurrences: result.occurrences.map((occ) => ({
          id: occ.id,
          occurrenceAt: occ.occurrenceAt,
          status: occ.status,
        })),
      });
    } catch (error: any) {
      console.error("[API] Generate occurrences error:", error);
      return errorResponse(error.message || "Failed to generate occurrences", 500);
    }
  })(req);
}
