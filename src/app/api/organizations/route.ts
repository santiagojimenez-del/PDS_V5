import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { createOrganizationSchema } from "@/modules/organizations/schemas/organization-schemas";
import { getAllOrganizations, createOrganization } from "@/modules/organizations/services/organization-service";

/**
 * GET /api/organizations
 * List all organizations with metadata
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  try {
    const organizations = await getAllOrganizations();
    return successResponse({ organizations, total: organizations.length });
  } catch (error: any) {
    console.error("[API] Get organizations error:", error);
    return errorResponse(error.message || "Failed to fetch organizations", 500);
  }
});

/**
 * POST /api/organizations
 * Create a new organization
 */
export const POST = withAuth(async (_user, req: NextRequest) => {
  let step = "init";
  try {
    step = "reading body";
    const body = await req.json();

    step = "validating";
    const parsed = createOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    step = "creating organization";
    const newOrganization = await createOrganization(parsed.data);

    return successResponse({ organization: newOrganization }, 201);
  } catch (error: any) {
    console.error("[API] Create organization error at step:", step, error);
    return errorResponse(`Error at [${step}]: ${error?.message || "unknown"}`, 500);
  }
});
