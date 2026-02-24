import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";

/**
 * GET /api/scheduling/pilots/[id]/calendar
 * Returns scheduled jobs for a pilot during a given week.
 *
 * Query params:
 *   weekStart  - ISO date string (YYYY-MM-DD), defaults to current Monday
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const segments = new URL(req.url).pathname.split("/");
  // path: /api/scheduling/pilots/[id]/calendar  → segments[-2] = "calendar", [-3] = id
  const pilotId = parseInt(segments[segments.length - 2]);
  if (isNaN(pilotId)) return errorResponse("Invalid pilot ID");

  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("weekStart");

  // Resolve week start (Monday) and end (Sunday)
  let weekStart: Date;
  if (weekStartParam) {
    weekStart = new Date(weekStartParam);
  } else {
    weekStart = new Date();
    const day = weekStart.getDay(); // 0=Sun, 1=Mon …
    weekStart.setDate(weekStart.getDate() - ((day + 6) % 7)); // roll back to Monday
  }
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  try {
    // Find all job_meta rows where persons_assigned contains this pilot
    // and the job has a scheduled date within the week
    const assignedMeta = await db
      .select({
        jobId: jobMeta.jobId,
        metaValue: jobMeta.metaValue,
      })
      .from(jobMeta)
      .where(
        and(
          eq(jobMeta.metaKey, "persons_assigned"),
          sql`JSON_CONTAINS(${jobMeta.metaValue}, CAST(${pilotId} AS JSON))`
        )
      );

    if (assignedMeta.length === 0) {
      return successResponse({ assignments: [], weekStart: weekStartStr, weekEnd: weekEndStr });
    }

    const jobIds = assignedMeta.map((m) => m.jobId);

    // Get those jobs that have a scheduled date within the week
    const scheduledJobs = await db
      .select({
        id: jobs.id,
        name: jobs.name,
        pipeline: jobs.pipeline,
        dates: jobs.dates,
      })
      .from(jobs)
      .where(
        and(
          sql`${jobs.id} IN (${sql.join(jobIds.map((id) => sql`${id}`), sql`, `)})`,
          ne(jobs.pipeline, "completed"),
          sql`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.scheduled')) BETWEEN ${weekStartStr} AND ${weekEndStr}`
        )
      );

    const assignments = scheduledJobs.map((job) => {
      const dates = (job.dates as Record<string, string>) || {};
      return {
        jobId: job.id,
        jobName: job.name || `Job #${job.id}`,
        scheduledDate: dates.scheduled || "",
        pipeline: job.pipeline,
      };
    });

    return successResponse({ assignments, weekStart: weekStartStr, weekEnd: weekEndStr });
  } catch (error) {
    console.error("[Scheduling API] Pilot calendar error:", error);
    return errorResponse("Failed to get pilot calendar", 500);
  }
});
