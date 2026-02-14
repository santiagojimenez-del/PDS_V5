import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta, sites, organization, userMeta, products } from "@/lib/db/schema";
import { eq, ne, inArray, count, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { z } from "zod";

export const GET = withAuth(async (_user, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const pipeline = searchParams.get("pipeline");
  const limit = parseInt(searchParams.get("limit") || "200");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query - fetch active jobs + recent completed separately
  const selectFields = {
    id: jobs.id,
    pipeline: jobs.pipeline,
    name: jobs.name,
    client: jobs.client,
    clientId: jobs.clientId,
    clientType: jobs.clientType,
    dates: jobs.dates,
    siteId: jobs.siteId,
    products: jobs.products,
  };

  let jobRows;

  if (pipeline) {
    jobRows = await db
      .select(selectFields)
      .from(jobs)
      .where(eq(jobs.pipeline, pipeline))
      .limit(limit)
      .offset(offset)
      .orderBy(jobs.id);
  } else {
    // Active jobs (all non-completed)
    const activeJobs = await db
      .select(selectFields)
      .from(jobs)
      .where(ne(jobs.pipeline, "completed"))
      .limit(limit)
      .offset(offset)
      .orderBy(jobs.id);

    // Recent completed (last 50)
    const completedJobs = await db
      .select(selectFields)
      .from(jobs)
      .where(eq(jobs.pipeline, "completed"))
      .limit(50)
      .orderBy(sql`${jobs.id} DESC`);

    jobRows = [...activeJobs, ...completedJobs];
  }

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

    const rawProducts = Array.isArray(job.products) ? job.products : [];
    const productList = rawProducts.map((p: any) => {
      const pid = typeof p === "number" ? p : p?.id;
      return { id: pid, name: productMap[pid] || `Product ${pid}` };
    });

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

const createJobSchema = z.object({
  name: z.string().min(1, "Job name is required").max(255),
  siteId: z.number({ message: "Site is required" }).int().positive(),
  clientId: z.number({ message: "Client is required" }).int().positive(),
  clientType: z.enum(["organization", "user"]).default("organization"),
  dateRequested: z.string().nullable().optional(),
  products: z.array(z.number().int().positive()).optional().default([]),
  notes: z.string().optional(),
  amountPayable: z.string().optional(),
});

export const POST = withAuth(async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { name, siteId, clientId, clientType, dateRequested, products: productIds, notes, amountPayable } = parsed.data;

    const result = await db.insert(jobs).values({
      name,
      siteId,
      client: { id: clientId, type: clientType },
      dates: { requested: dateRequested || new Date().toISOString().split("T")[0] },
      products: productIds,
      pipeline: "bids",
      createdBy: user.id,
    });

    const insertedId = result[0].insertId;

    // Set optional meta values
    if (notes) {
      await setMetaValue(db, jobMeta, jobMeta.jobId, insertedId, "notes", notes);
    }
    if (amountPayable) {
      await setMetaValue(db, jobMeta, jobMeta.jobId, insertedId, "amount_payable", amountPayable);
    }

    // Recalculate pipeline
    await callUpdateJobPipeline(db, insertedId);

    return successResponse({ id: insertedId, name }, 201);
  } catch (error) {
    console.error("[API] Create job error:", error);
    return errorResponse("Failed to create job", 500);
  }
});
