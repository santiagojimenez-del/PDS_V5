import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { callUpdateJobPipeline } from "@/lib/db/helpers";
import { deliverJobSchema } from "@/modules/workflow/schemas/job-schemas";
import { getJobById, updateJobDates } from "@/modules/workflow/services/job-service";
import { sendDeliveryNotification } from "@/modules/workflow/services/workflow-emails";
import { createNotification } from "@/modules/notifications/notification-service";

export const POST = withAuth(async (_user, req: NextRequest) => {
  const segments = new URL(req.url).pathname.split("/");
  const jobId = parseInt(segments[segments.length - 2]);
  if (isNaN(jobId)) return errorResponse("Invalid job ID");

  const existing = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!existing.length) return notFoundResponse("Job not found");

  try {
    const body = await req.json();
    const parsed = deliverJobSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const deliveredDate = parsed.data.deliveredDate || new Date().toISOString().split("T")[0];

    await updateJobDates(jobId, { delivered: deliveredDate });
    await callUpdateJobPipeline(db, jobId);

    const updated = await getJobById(jobId);

    if (updated) {
      // Fire-and-forget: notify client by email
      sendDeliveryNotification(updated, deliveredDate);

      // In-app: notify job creator + client (if user type)
      createNotification({
        userId: updated.createdBy,
        type: "job_delivered",
        title: `Job delivered: ${updated.name || `#${jobId}`}`,
        message: `Deliverables are ready for the client`,
        link: `/workflow/jobs/${jobId}`,
      });

      if (updated.clientType === "user" && updated.clientId) {
        createNotification({
          userId: updated.clientId,
          type: "job_delivered",
          title: `Your deliverables are ready!`,
          message: `${updated.name || `Job #${jobId}`} – files are ready to view`,
          link: `/job/${jobId}`,
        });
      }
    }

    return successResponse(updated);
  } catch (error) {
    console.error("[API] Deliver job error:", error);
    return errorResponse("Failed to deliver job", 500);
  }
});
