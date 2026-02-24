import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { billJobSchema } from "@/modules/workflow/schemas/job-schemas";
import { getJobById, updateJobDates } from "@/modules/workflow/services/job-service";
import { createNotification } from "@/modules/notifications/notification-service";

export const POST = withAuth(async (_user, req: NextRequest) => {
  const segments = new URL(req.url).pathname.split("/");
  const jobId = parseInt(segments[segments.length - 2]);
  if (isNaN(jobId)) return errorResponse("Invalid job ID");

  const existing = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!existing.length) return notFoundResponse("Job not found");

  try {
    const body = await req.json();
    const parsed = billJobSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { invoiceNumber } = parsed.data;
    const billedDate = parsed.data.billedDate || new Date().toISOString().split("T")[0];

    await updateJobDates(jobId, { billed: billedDate });
    await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "invoice_number", invoiceNumber);
    await callUpdateJobPipeline(db, jobId);

    const updated = await getJobById(jobId);

    // Fire-and-forget: in-app notification to job creator
    if (updated) {
      createNotification({
        userId: updated.createdBy,
        type: "job_billed",
        title: `Job billed: ${updated.name || `#${jobId}`}`,
        message: `Invoice ${invoiceNumber} created`,
        link: `/workflow/jobs/${jobId}`,
      });

      // Notify client if user type
      if (updated.clientType === "user" && updated.clientId) {
        createNotification({
          userId: updated.clientId,
          type: "job_billed",
          title: `Invoice ready: ${updated.name || `Job #${jobId}`}`,
          message: `Invoice ${invoiceNumber} has been sent to you`,
          link: `/job/${jobId}`,
        });
      }
    }

    return successResponse(updated);
  } catch (error) {
    console.error("[API] Bill job error:", error);
    return errorResponse("Failed to bill job", 500);
  }
});
