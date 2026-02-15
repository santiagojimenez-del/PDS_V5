import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { updateOrganizationSchema } from "@/modules/organizations/schemas/organization-schemas";
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "@/modules/organizations/services/organization-service";

/**
 * GET /api/organizations/[id]
 * Get a single organization by ID
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_user) => {
    try {
      const { id } = await context.params;
      const orgId = parseInt(id, 10);

      if (isNaN(orgId)) {
        return errorResponse("Invalid organization ID", 400);
      }

      const organization = await getOrganizationById(orgId);

      if (!organization) {
        return notFoundResponse("Organization not found");
      }

      return successResponse({ organization });
    } catch (error: any) {
      console.error("[API] Get organization error:", error);
      return errorResponse(error.message || "Failed to fetch organization", 500);
    }
  })(req);
}

/**
 * PUT /api/organizations/[id]
 * Update an organization
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_user) => {
    let step = "init";
    try {
      const { id } = await context.params;
      const orgId = parseInt(id, 10);

      if (isNaN(orgId)) {
        return errorResponse("Invalid organization ID", 400);
      }

      step = "reading body";
      const body = await req.json();

      step = "validating";
      const parsed = updateOrganizationSchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || "Invalid input";
        return errorResponse(firstError, 422);
      }

      step = "updating organization";
      const updated = await updateOrganization(orgId, parsed.data);

      if (!updated) {
        return notFoundResponse("Organization not found");
      }

      return successResponse({ organization: updated });
    } catch (error: any) {
      console.error("[API] Update organization error at step:", step, error);
      return errorResponse(`Error at [${step}]: ${error?.message || "unknown"}`, 500);
    }
  })(req);
}

/**
 * DELETE /api/organizations/[id]
 * Delete an organization
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_user) => {
    try {
      const { id } = await context.params;
      const orgId = parseInt(id, 10);

      if (isNaN(orgId)) {
        return errorResponse("Invalid organization ID", 400);
      }

      const deleted = await deleteOrganization(orgId);

      if (!deleted) {
        return notFoundResponse("Organization not found");
      }

      return successResponse({ message: "Organization deleted successfully" });
    } catch (error: any) {
      console.error("[API] Delete organization error:", error);

      // Handle specific error about associated jobs
      if (error.message?.includes("Cannot delete organization")) {
        return errorResponse(error.message, 400);
      }

      return errorResponse(error.message || "Failed to delete organization", 500);
    }
  })(req);
}
