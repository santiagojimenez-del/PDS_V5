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

    // Fire-and-forget: notify the client by email
    if (updated) {
      sendDeliveryNotification(updated, deliveredDate);
    }

    return successResponse(updated);
  } catch (error) {
    console.error("[API] Deliver job error:", error);
    return errorResponse("Failed to deliver job", 500);
  }
});
