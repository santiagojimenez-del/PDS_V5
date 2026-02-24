import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta, sites } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";

/**
 * GET /api/scheduling/my-assignments
 * Returns all jobs assigned to the currently logged-in user (pilot view).
 *
 * Query params:
 *   status  - "upcoming" (default) | "all" | "completed"
 */
export const GET = withAuth(async (user, _req: NextRequest) => {
  const { searchParams } = new URL(_req.url);
  const status = searchParams.get("status") ?? "upcoming";

  try {
    // Find all job_meta rows where persons_assigned contains this user's ID
    const assignedMeta = await db
      .select({ jobId: jobMeta.jobId })
      .from(jobMeta)
      .where(
        and(
          eq(jobMeta.metaKey, "persons_assigned"),
          sql`JSON_CONTAINS(${jobMeta.metaValue}, CAST(${user.id} AS JSON))`
        )
      );

    if (assignedMeta.length === 0) {
      return successResponse({ assignments: [], total: 0 });
    }

    const jobIds = assignedMeta.map((m) => m.jobId);

    // Build pipeline filter based on status param
    let pipelineFilter;
    if (status === "completed") {
      pipelineFilter = sql`${jobs.pipeline} = 'completed'`;
    } else if (status === "upcoming") {
      pipelineFilter = ne(jobs.pipeline, "completed");
    }
    // "all" = no pipeline filter

    const conditions = [
      sql`${jobs.id} IN (${sql.join(jobIds.map((id) => sql`${id}`), sql`, `)})`,
    ];
    if (pipelineFilter) conditions.push(pipelineFilter);

    const jobRows = await db
      .select({
        id: jobs.id,
        name: jobs.name,
        pipeline: jobs.pipeline,
        dates: jobs.dates,
        siteId: jobs.siteId,
        products: jobs.products,
      })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(
        sql`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.scheduled')) DESC`
      );

    // Gather unique site IDs
    const siteIds = [...new Set(jobRows.map((j) => j.siteId).filter(Boolean))];
    const siteMap: Record<number, string> = {};
    if (siteIds.length > 0) {
      const siteRows = await db
        .select({ id: sites.id, name: sites.name })
        .from(sites)
        .where(sql`${sites.id} IN (${sql.join(siteIds.map((id) => sql`${id}`), sql`, `)})`);
      for (const s of siteRows) siteMap[s.id] = s.name;
    }

    const assignments = jobRows.map((job) => {
      const dates = (job.dates as Record<string, string>) || {};
      return {
        id: job.id,
        name: job.name || `Job #${job.id}`,
        pipeline: job.pipeline,
        siteName: job.siteId ? (siteMap[job.siteId] ?? "Unknown Site") : "No Site",
        scheduledDate: dates.scheduled ?? null,
        flownDate: dates.flown ?? null,
        requestedDate: dates.requested ?? null,
      };
    });

    return successResponse({ assignments, total: assignments.length });
  } catch (error) {
    console.error("[Scheduling API] My assignments error:", error);
    return errorResponse("Failed to get assignments", 500);
  }
});
