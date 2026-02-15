import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { createTemplateSchema } from "@/modules/recurring/schemas/recurring-schemas";
import { db } from "@/lib/db";
import { recurringJobTemplates, sites, organization } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { createTemplate } from "@/modules/recurring/services/recurring-service";

/**
 * GET /api/recurring
 * List all recurring job templates
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  try {
    const templates = await db
      .select()
      .from(recurringJobTemplates)
      .orderBy(recurringJobTemplates.name);

    if (templates.length === 0) {
      return successResponse({ templates: [], total: 0 });
    }

    // Get site names
    const siteIds = [...new Set(templates.map((t) => t.siteId))];
    const siteMap: Record<number, string> = {};
    if (siteIds.length > 0) {
      const siteRows = await db
        .select({ id: sites.id, name: sites.name })
        .from(sites)
        .where(inArray(sites.id, siteIds));
      for (const s of siteRows) siteMap[s.id] = s.name;
    }

    // Get client names
    const orgIds = [
      ...new Set(
        templates
          .filter((t) => t.clientType === "organization")
          .map((t) => t.clientId)
      ),
    ];
    const orgMap: Record<number, string> = {};
    if (orgIds.length > 0) {
      const orgRows = await db
        .select({ id: organization.id, name: organization.name })
        .from(organization)
        .where(inArray(organization.id, orgIds));
      for (const o of orgRows) orgMap[o.id] = o.name;
    }

    const enriched = templates.map((t) => ({
      id: t.id,
      name: t.name,
      active: t.active === 1,
      isManual: t.isManual === 1,
      siteName: siteMap[t.siteId] || "Unknown",
      clientName:
        t.clientType === "organization"
          ? orgMap[t.clientId] || "Unknown"
          : `User #${t.clientId}`,
      clientType: t.clientType,
      rrule: t.rrule,
      timezone: t.timezone,
      amountPayable: t.amountPayable,
      products: t.products,
      createdAt: t.createdAt,
    }));

    return successResponse({ templates: enriched, total: enriched.length });
  } catch (error: any) {
    console.error("[API] Get recurring templates error:", error);
    return errorResponse(
      error.message || "Failed to fetch templates",
      500
    );
  }
});

/**
 * POST /api/recurring
 * Create a new recurring job template
 */
export const POST = withAuth(async (user, req: NextRequest) => {
  let step = "init";
  try {
    step = "reading body";
    const body = await req.json();

    step = "validating";
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    step = "creating template";
    const template = await createTemplate(parsed.data, user.id);

    return successResponse({ template }, 201);
  } catch (error: any) {
    console.error("[API] Create recurring template error at step:", step, error);
    return errorResponse(
      `Error at [${step}]: ${error?.message || "unknown"}`,
      500
    );
  }
});
