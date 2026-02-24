import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { scheduleJobSchema } from "@/modules/workflow/schemas/job-schemas";
import { getJobById, updateJobDates } from "@/modules/workflow/services/job-service";
import { sendPilotNotifications } from "@/modules/workflow/services/workflow-emails";
import { createNotifications, createNotification } from "@/modules/notifications/notification-service";

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

    // Fire-and-forget: notify assigned pilots by email + in-app
    if (personsAssigned.length > 0 && updated) {
      sendPilotNotifications(personsAssigned, updated, "scheduled", scheduledDate);
      createNotifications(personsAssigned, {
        type: "job_scheduled",
        title: `You've been assigned: ${updated.name || `Job #${jobId}`}`,
        message: `Scheduled for ${scheduledDate}`,
        link: `/workflow/jobs/${jobId}`,
      });
    }

    // Notify job creator too
    if (updated) {
      createNotification({
        userId: updated.createdBy,
        type: "job_scheduled",
        title: `Job scheduled: ${updated.name || `#${jobId}`}`,
        message: `Scheduled for ${scheduledDate} with ${personsAssigned.length} pilot(s)`,
        link: `/workflow/jobs/${jobId}`,
      });
    }

    return successResponse(updated);
  } catch (error) {
    console.error("[API] Schedule job error:", error);
    return errorResponse("Failed to schedule job", 500);
  }
});
