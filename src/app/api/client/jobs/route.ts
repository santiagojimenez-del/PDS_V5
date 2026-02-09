import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, sites, products } from "@/lib/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async (user, _req: NextRequest) => {
  // Get jobs where client is the current user (individual) or their org
  const userJobs = await db
    .select()
    .from(jobs)
    .where(
      or(
        eq(jobs.clientId, String(user.id)),
        eq(jobs.createdBy, user.id)
      )
    );

  if (userJobs.length === 0) {
    return successResponse({ jobs: [], total: 0 });
  }

  // Get site names
  const siteIds = [...new Set(userJobs.map((j) => j.siteId))];
  const siteMap: Record<number, string> = {};
  if (siteIds.length > 0) {
    const siteRows = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(inArray(sites.id, siteIds));
    for (const s of siteRows) siteMap[s.id] = s.name;
  }

  // Get product names
  const allProductRows = await db.select({ id: products.id, name: products.name }).from(products);
  const productMap: Record<number, string> = {};
  for (const p of allProductRows) productMap[p.id] = p.name;

  const enriched = userJobs.map((j) => {
    let productNames: string[] = [];
    try {
      const prods = j.products as Array<{ id: number }>;
      productNames = prods.map((p) => productMap[p.id] || `Product #${p.id}`);
    } catch { /* ignore */ }

    let dates: { requested?: string; scheduled?: string; completed?: string } = {};
    try { dates = j.dates as typeof dates; } catch { /* ignore */ }

    return {
      id: j.id,
      name: j.name,
      pipeline: j.pipeline,
      siteName: siteMap[j.siteId] || "Unknown",
      products: productNames,
      dateRequested: dates.requested || null,
      dateScheduled: dates.scheduled || null,
    };
  });

  return successResponse({ jobs: enriched, total: enriched.length });
});
