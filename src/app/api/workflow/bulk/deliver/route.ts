import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkDeliverSchema } from "@/modules/workflow/schemas/bulk-schemas";
import { callUpdateJobPipeline } from "@/lib/db/helpers";
import { updateJobDates, getJobById } from "@/modules/workflow/services/job-service";
import { sendDeliveryNotification } from "@/modules/workflow/services/workflow-emails";

export const POST = withAuth(async (user, req) => {
    const body = await req.json();
    const parsed = bulkDeliverSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { jobIds, deliveredDate } = parsed.data;
    const deliveryDateValue = deliveredDate || new Date().toISOString().split("T")[0];

    const result = await executeBulkAction(
        user,
        "deliver",
        "bill",
        jobIds,
        async (jobId: number) => {
            await updateJobDates(jobId, { delivered: deliveryDateValue });
            await callUpdateJobPipeline(db, jobId);
        }
    );

    // Fire-and-forget: notify each client whose job was successfully delivered
    if (result.succeeded > 0) {
        const succeededIds = jobIds.filter((id) => !result.errors.find((e) => e.jobId === id));
        Promise.allSettled(
            succeededIds.map(async (jobId) => {
                const job = await getJobById(jobId);
                if (job) await sendDeliveryNotification(job, deliveryDateValue);
            })
        ).catch(() => {});
    }

    return successResponse(result);
});
