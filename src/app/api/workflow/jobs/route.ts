import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, sites, organization, userMeta, products } from "@/lib/db/schema";
import { eq, ne, inArray, count, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async (_user, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const pipeline = searchParams.get("pipeline");
  const limit = parseInt(searchParams.get("limit") || "200");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query
  const conditions = pipeline
    ? eq(jobs.pipeline, pipeline)
    : ne(jobs.pipeline, "completed");

  const jobRows = await db
    .select({
      id: jobs.id,
      pipeline: jobs.pipeline,
      name: jobs.name,
      client: jobs.client,
      clientId: jobs.clientId,
      clientType: jobs.clientType,
      dates: jobs.dates,
      siteId: jobs.siteId,
      products: jobs.products,
    })
    .from(jobs)
    .where(conditions)
    .limit(limit)
    .offset(offset)
    .orderBy(jobs.id);

  // Collect unique site IDs and client IDs
  const siteIds = [...new Set(jobRows.map((j) => j.siteId))];
  const orgIds = [
    ...new Set(
      jobRows.filter((j) => j.clientType === "organization").map((j) => parseInt(j.clientId!))
    ),
  ];
  const userIds = [
    ...new Set(
      jobRows.filter((j) => j.clientType === "user").map((j) => parseInt(j.clientId!))
    ),
  ];

  // Batch load site names
  const siteMap: Record<number, string> = {};
  if (siteIds.length > 0) {
    const siteRows = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(inArray(sites.id, siteIds));
    for (const s of siteRows) siteMap[s.id] = s.name;
  }

  // Batch load org names
  const orgMap: Record<number, string> = {};
  if (orgIds.length > 0) {
    const orgRows = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(inArray(organization.id, orgIds));
    for (const o of orgRows) orgMap[o.id] = o.name;
  }

  // Batch load user names
  const userNameMap: Record<number, string> = {};
  if (userIds.length > 0) {
    const metaRows = await db
      .select({
        uid: userMeta.uid,
        metaKey: userMeta.metaKey,
        metaValue: userMeta.metaValue,
      })
      .from(userMeta)
      .where(inArray(userMeta.uid, userIds));

    const tempMap: Record<number, { first?: string; last?: string }> = {};
    for (const m of metaRows) {
      if (m.metaKey === "first_name" || m.metaKey === "last_name") {
        if (!tempMap[m.uid]) tempMap[m.uid] = {};
        if (m.metaKey === "first_name") tempMap[m.uid].first = m.metaValue || "";
        if (m.metaKey === "last_name") tempMap[m.uid].last = m.metaValue || "";
      }
    }
    for (const [uid, name] of Object.entries(tempMap)) {
      userNameMap[parseInt(uid)] = [name.first, name.last].filter(Boolean).join(" ");
    }
  }

  // Load all products for product name mapping
  const productRows = await db.select({ id: products.id, name: products.name }).from(products);
  const productMap: Record<number, string> = {};
  for (const p of productRows) productMap[p.id] = p.name;

  // Build response
  const enrichedJobs = jobRows.map((job) => {
    const clientId = job.clientId ? parseInt(job.clientId) : null;
    const clientName =
      job.clientType === "organization" && clientId
        ? orgMap[clientId]
        : job.clientType === "user" && clientId
          ? userNameMap[clientId]
          : "Unknown";

    const productList = Array.isArray(job.products)
      ? (job.products as number[]).map((pid) => ({
          id: pid,
          name: productMap[pid] || `Product ${pid}`,
        }))
      : [];

    return {
      id: job.id,
      pipeline: job.pipeline,
      name: job.name,
      siteName: siteMap[job.siteId] || "Unknown Site",
      siteId: job.siteId,
      clientName,
      clientType: job.clientType,
      clientId,
      dates: job.dates as Record<string, string>,
      products: productList,
    };
  });

  // Pipeline counts
  const pipelineCounts = await db
    .select({ pipeline: jobs.pipeline, count: count() })
    .from(jobs)
    .groupBy(jobs.pipeline);

  const counts: Record<string, number> = {};
  for (const row of pipelineCounts) {
    counts[row.pipeline || "unknown"] = row.count;
  }

  return successResponse({ jobs: enrichedJobs, counts });
});
