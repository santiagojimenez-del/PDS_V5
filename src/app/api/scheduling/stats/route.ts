import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { and, ne, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";

/**
 * GET /api/scheduling/stats
 * Returns scheduling stats for the dashboard:
 *   - jobsThisWeek: jobs with a scheduled date in the current week
 *   - pilotAssignments: total active job-pilot assignments (unique pilots assigned to non-completed jobs)
 */
export const GET = withAuth(async (_user, _req: NextRequest) => {
  try {
    const now = new Date();

    // Monday of current week
    const weekStart = new Date(now);
    const day = weekStart.getDay(); // 0=Sun
    weekStart.setDate(weekStart.getDate() - ((day + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    // Sunday of current week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Jobs scheduled this week (not completed)
    const [weekJobsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobs)
      .where(
        and(
          ne(jobs.pipeline, "completed"),
          sql`JSON_UNQUOTE(JSON_EXTRACT(${jobs.dates}, '$.scheduled')) BETWEEN ${weekStartStr} AND ${weekEndStr}`
        )
      );

    // Unique pilot IDs assigned to active jobs
    const assignedRows = await db
      .select({ metaValue: jobMeta.metaValue })
      .from(jobMeta)
      .innerJoin(jobs, sql`${jobMeta.jobId} = ${jobs.id}`)
      .where(
        and(
          sql`${jobMeta.metaKey} = 'persons_assigned'`,
          ne(jobs.pipeline, "completed")
        )
      );

    // Count unique pilots across all assignments
    const pilotSet = new Set<number>();
    for (const row of assignedRows) {
      try {
        const ids: number[] = JSON.parse(row.metaValue);
        if (Array.isArray(ids)) ids.forEach((id) => pilotSet.add(id));
      } catch {
        // skip invalid JSON
      }
    }

    return successResponse({
      jobsThisWeek: weekJobsResult?.count ?? 0,
      activePilotAssignments: pilotSet.size,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
    });
  } catch (error) {
    console.error("[Scheduling Stats] Error:", error);
    return errorResponse("Failed to get scheduling stats", 500);
  }
});
