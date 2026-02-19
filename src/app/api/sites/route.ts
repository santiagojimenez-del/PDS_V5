import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

/**
 * GET /api/sites
 * Lightweight list of all sites (id, name, address) for selectors.
 */
export const GET = withAuth(async () => {
  const rows = await db
    .select({ id: sites.id, name: sites.name, address: sites.address })
    .from(sites)
    .orderBy(asc(sites.name));

  return successResponse({ sites: rows, total: rows.length });
});
