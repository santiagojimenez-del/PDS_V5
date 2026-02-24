import { db } from "@/lib/db";
import { pilotAvailability, pilotBlackout, jobs, jobMeta } from "@/lib/db/schema";
import { eq, and, lte, gte, sql, count } from "drizzle-orm";
import { getMetaValue } from "@/lib/db/helpers";
import type { ConflictReport, ConflictType } from "../types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, getDay, format } from "date-fns";

/**
 * Detect all scheduling conflicts for a pilot on a specific date
 */
export async function detectScheduleConflicts(
  pilotId: number,
  scheduledDate: string, // YYYY-MM-DD format
  durationHours: number = 4
): Promise<ConflictReport> {
  const conflicts: ConflictType[] = [];
  const date = parseISO(scheduledDate);
  const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

  // 1. Check if pilot has availability for this day of week.
  //    If the pilot has NO records at all, they haven't configured their schedule yet
  //    → treat as available (opt-in model: restrict only what's explicitly blocked).
  //    If the pilot HAS records but not for this day → they marked it as unavailable.
  const [{ total: totalRecords }] = await db
    .select({ total: count() })
    .from(pilotAvailability)
    .where(eq(pilotAvailability.pilotId, pilotId));

  const hasConfiguredSchedule = (totalRecords ?? 0) > 0;

  if (hasConfiguredSchedule) {
    const availability = await db
      .select()
      .from(pilotAvailability)
      .where(
        and(
          eq(pilotAvailability.pilotId, pilotId),
          eq(pilotAvailability.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);

    if (availability.length === 0 || !availability[0].isAvailable) {
      conflicts.push({
        type: "unavailable",
        severity: "error",
        message: `Pilot is not available on ${format(date, "EEEE")}s`,
        details: { dayOfWeek, hasAvailability: availability.length > 0 },
      });
    }
  }
  // else: no records → pilot hasn't set a schedule yet → no availability conflict

  // 2. Check for blackout dates
  const blackouts = await db
    .select()
    .from(pilotBlackout)
    .where(
      and(
        eq(pilotBlackout.pilotId, pilotId),
        lte(pilotBlackout.startDate, date),
        gte(pilotBlackout.endDate, date)
      )
    );

  if (blackouts.length > 0) {
    conflicts.push({
      type: "blackout",
      severity: "error",
      message: `Pilot has blackout period: ${blackouts[0].reason || "Unavailable"}`,
      details: { blackout: blackouts[0] },
    });
  }

  // 3. Check for double-booking (existing assignments on same date)
  const existingJobs = await db
    .select({
      jobId: jobs.id,
      jobName: jobs.name,
      dates: jobs.dates,
      personsAssigned: jobMeta.metaValue,
    })
    .from(jobs)
    .leftJoin(jobMeta, and(
      eq(jobMeta.jobId, jobs.id),
      eq(jobMeta.metaKey, "persons_assigned")
    ))
    .where(
      sql`JSON_EXTRACT(${jobs.dates}, '$.scheduled') = ${scheduledDate}`
    );

  const assignedJobs = existingJobs.filter((job) => {
    if (!job.personsAssigned) return false;
    try {
      const assignedPilots = JSON.parse(job.personsAssigned);
      return Array.isArray(assignedPilots) && assignedPilots.includes(pilotId);
    } catch {
      return false;
    }
  });

  if (assignedJobs.length > 0) {
    conflicts.push({
      type: "double_booking",
      severity: "error",
      message: `Pilot is already assigned to ${assignedJobs.length} job(s) on this date`,
      details: { jobs: assignedJobs.map((j) => ({ id: j.jobId, name: j.jobName })) },
    });
  }

  // 4. Check job limits (max jobs per week/month)
  const maxJobsPerWeek = await getMetaValue(db, jobMeta, jobMeta.jobId, pilotId, "max_jobs_per_week");
  const maxJobsPerMonth = await getMetaValue(db, jobMeta, jobMeta.jobId, pilotId, "max_jobs_per_month");

  if (maxJobsPerWeek) {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    const weekJobCount = await countPilotJobsInRange(pilotId, weekStart, weekEnd);

    if (weekJobCount >= parseInt(maxJobsPerWeek, 10)) {
      conflicts.push({
        type: "job_limit_exceeded",
        severity: "warning",
        message: `Pilot has reached weekly job limit (${weekJobCount}/${maxJobsPerWeek})`,
        details: { weekJobCount, maxJobsPerWeek },
      });
    }
  }

  if (maxJobsPerMonth) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const monthJobCount = await countPilotJobsInRange(pilotId, monthStart, monthEnd);

    if (monthJobCount >= parseInt(maxJobsPerMonth, 10)) {
      conflicts.push({
        type: "job_limit_exceeded",
        severity: "warning",
        message: `Pilot has reached monthly job limit (${monthJobCount}/${maxJobsPerMonth})`,
        details: { monthJobCount, maxJobsPerMonth },
      });
    }
  }

  const hasErrors = conflicts.some((c) => c.severity === "error");

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    canSchedule: !hasErrors,
  };
}

/**
 * Check if pilot is available during a specific date range
 */
export async function isAvailable(
  pilotId: number,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  // Check for blackout periods
  const blackouts = await db
    .select()
    .from(pilotBlackout)
    .where(
      and(
        eq(pilotBlackout.pilotId, pilotId),
        lte(pilotBlackout.startDate, endDate),
        gte(pilotBlackout.endDate, startDate)
      )
    );

  return blackouts.length === 0;
}

/**
 * Count pilot's jobs in a date range
 */
async function countPilotJobsInRange(
  pilotId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  const jobsInRange = await db
    .select({
      jobId: jobs.id,
      personsAssigned: jobMeta.metaValue,
    })
    .from(jobs)
    .leftJoin(jobMeta, and(
      eq(jobMeta.jobId, jobs.id),
      eq(jobMeta.metaKey, "persons_assigned")
    ))
    .where(
      sql`JSON_EXTRACT(${jobs.dates}, '$.scheduled') >= ${startDateStr}
          AND JSON_EXTRACT(${jobs.dates}, '$.scheduled') <= ${endDateStr}`
    );

  let count = 0;
  for (const job of jobsInRange) {
    if (job.personsAssigned) {
      try {
        const assignedPilots = JSON.parse(job.personsAssigned);
        if (Array.isArray(assignedPilots) && assignedPilots.includes(pilotId)) {
          count++;
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  return count;
}

/**
 * Get all assignments for a pilot in a date range
 */
export async function getPilotAssignments(
  pilotId: number,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  const allJobs = await db
    .select({
      jobId: jobs.id,
      jobName: jobs.name,
      dates: jobs.dates,
      personsAssigned: jobMeta.metaValue,
    })
    .from(jobs)
    .leftJoin(jobMeta, and(
      eq(jobMeta.jobId, jobs.id),
      eq(jobMeta.metaKey, "persons_assigned")
    ))
    .where(
      sql`JSON_EXTRACT(${jobs.dates}, '$.scheduled') >= ${startDateStr}
          AND JSON_EXTRACT(${jobs.dates}, '$.scheduled') <= ${endDateStr}`
    );

  const assignments = [];
  for (const job of allJobs) {
    if (job.personsAssigned) {
      try {
        const assignedPilots = JSON.parse(job.personsAssigned);
        if (Array.isArray(assignedPilots) && assignedPilots.includes(pilotId)) {
          const dates = job.dates as Record<string, string>;
          assignments.push({
            jobId: job.jobId,
            jobName: job.jobName,
            scheduledDate: dates.scheduled || null,
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  return assignments;
}
