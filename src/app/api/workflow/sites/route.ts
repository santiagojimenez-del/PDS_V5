import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, users, userMeta, jobs } from "@/lib/db/schema";
import { eq, inArray, count, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async (_user, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const siteRows = await db
    .select({
      id: sites.id,
      name: sites.name,
      description: sites.description,
      address: sites.address,
      coordinates: sites.coordinates,
      boundary: sites.boundary,
      createdBy: sites.createdBy,
    })
    .from(sites)
    .limit(limit)
    .offset(offset)
    .orderBy(sites.name);

  // Get job counts per site
  const jobCounts = await db
    .select({ siteId: jobs.siteId, count: count() })
    .from(jobs)
    .groupBy(jobs.siteId);

  const jobCountMap: Record<number, number> = {};
  for (const jc of jobCounts) jobCountMap[jc.siteId] = jc.count;

  // Get creator names
  const creatorIds = [...new Set(siteRows.map((s) => s.createdBy))];
  const creatorMap: Record<number, string> = {};
  if (creatorIds.length > 0) {
    const metaRows = await db
      .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
      .from(userMeta)
      .where(inArray(userMeta.uid, creatorIds));

    const temp: Record<number, { first?: string; last?: string }> = {};
    for (const m of metaRows) {
      if (m.metaKey === "first_name" || m.metaKey === "last_name") {
        if (!temp[m.uid]) temp[m.uid] = {};
        if (m.metaKey === "first_name") temp[m.uid].first = m.metaValue || "";
        if (m.metaKey === "last_name") temp[m.uid].last = m.metaValue || "";
      }
    }
    for (const [uid, n] of Object.entries(temp)) {
      creatorMap[parseInt(uid)] = [n.first, n.last].filter(Boolean).join(" ");
    }
  }

  const totalResult = await db.select({ total: count() }).from(sites);

  const enriched = siteRows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    address: s.address,
    coordinates: s.coordinates,
    createdBy: creatorMap[s.createdBy] || "Unknown",
    jobCount: jobCountMap[s.id] || 0,
  }));

  return successResponse({ sites: enriched, total: totalResult[0].total });
});
