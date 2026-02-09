import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, jobs } from "@/lib/db/schema";
import { eq, or, inArray, count } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async (user, _req: NextRequest) => {
  // Get jobs belonging to this client
  const clientJobs = await db
    .select({ id: jobs.id, siteId: jobs.siteId })
    .from(jobs)
    .where(
      or(
        eq(jobs.clientId, String(user.id)),
        eq(jobs.createdBy, user.id)
      )
    );

  const siteIds = [...new Set(clientJobs.map((j) => j.siteId))];

  if (siteIds.length === 0) {
    return successResponse({ sites: [], total: 0 });
  }

  const siteRows = await db
    .select()
    .from(sites)
    .where(inArray(sites.id, siteIds));

  // Count jobs per site
  const jobCountMap: Record<number, number> = {};
  for (const j of clientJobs) {
    jobCountMap[j.siteId] = (jobCountMap[j.siteId] || 0) + 1;
  }

  const enriched = siteRows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    address: s.address,
    coordinates: s.coordinates,
    jobCount: jobCountMap[s.id] || 0,
  }));

  return successResponse({ sites: enriched, total: enriched.length });
});
