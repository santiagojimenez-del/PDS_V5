/**
 * POST /api/organizations/[id]/archive   — archive
 * DELETE /api/organizations/[id]/archive — unarchive
 */

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import {
  archiveOrganization,
  unarchiveOrganization,
} from "@/modules/organizations/services/organization-service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const orgId = parseInt(id, 10);
    if (isNaN(orgId)) return errorResponse("Invalid organization ID", 400);

    const ok = await archiveOrganization(orgId);
    if (!ok) return notFoundResponse("Organization not found");

    return successResponse({ message: "Organization archived" });
  })(req);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const orgId = parseInt(id, 10);
    if (isNaN(orgId)) return errorResponse("Invalid organization ID", 400);

    const ok = await unarchiveOrganization(orgId);
    if (!ok) return notFoundResponse("Organization not found");

    return successResponse({ message: "Organization unarchived" });
  })(req);
}
