import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { scheduleJobSchema } from "@/modules/workflow/schemas/job-schemas";
import { getJobById, updateJobDates } from "@/modules/workflow/services/job-service";

export const POST = withAuth(async (_user, req: NextRequest) => {
  const segments = new URL(req.url).pathname.split("/");
  const jobId = parseInt(segments[segments.length - 2]);
  if (isNaN(jobId)) return errorResponse("Invalid job ID");

  const existing = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!existing.length) return notFoundResponse("Job not found");

  try {
    const body = await req.json();
    const parsed = scheduleJobSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { scheduledDate, scheduledFlight, personsAssigned } = parsed.data;

    await updateJobDates(jobId, { scheduled: scheduledDate });
    await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "scheduled_flight", scheduledFlight);
    await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "persons_assigned", JSON.stringify(personsAssigned));
    await callUpdateJobPipeline(db, jobId);

    const updated = await getJobById(jobId);
    return successResponse(updated);
  } catch (error) {
    console.error("[API] Schedule job error:", error);
    return errorResponse("Failed to schedule job", 500);
  }
});
