import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { updateTemplateSchema } from "@/modules/recurring/schemas/recurring-schemas";
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "@/modules/recurring/services/recurring-service";

/**
 * GET /api/recurring/[id]
 * Get a single recurring job template
 */
export async function GET(
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

      const template = await getTemplateById(templateId);

      if (!template) {
        return notFoundResponse("Template not found");
      }

      return successResponse({ template });
    } catch (error: any) {
      console.error("[API] Get recurring template error:", error);
      return errorResponse(error.message || "Failed to fetch template", 500);
    }
  })(req);
}

/**
 * PUT /api/recurring/[id]
 * Update a recurring job template
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_user) => {
    let step = "init";
    try {
      const { id } = await context.params;
      const templateId = parseInt(id, 10);

      if (isNaN(templateId)) {
        return errorResponse("Invalid template ID", 400);
      }

      step = "reading body";
      const body = await req.json();

      step = "validating";
      const parsed = updateTemplateSchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Invalid input";
        return errorResponse(firstError, 422);
      }

      step = "updating template";
      const updated = await updateTemplate(templateId, parsed.data);

      if (!updated) {
        return notFoundResponse("Template not found");
      }

      return successResponse({ template: updated });
    } catch (error: any) {
      console.error("[API] Update recurring template error at step:", step, error);
      return errorResponse(`Error at [${step}]: ${error?.message || "unknown"}`, 500);
    }
  })(req);
}

/**
 * DELETE /api/recurring/[id]
 * Delete a recurring job template
 */
export async function DELETE(
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

      const deleted = await deleteTemplate(templateId);

      if (!deleted) {
        return notFoundResponse("Template not found");
      }

      return successResponse({ message: "Template deleted successfully" });
    } catch (error: any) {
      console.error("[API] Delete recurring template error:", error);

      // Handle specific error about created jobs
      if (error.message?.includes("Cannot delete template")) {
        return errorResponse(error.message, 400);
      }

      return errorResponse(error.message || "Failed to delete template", 500);
    }
  })(req);
}
