import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkDeliverSchema } from "@/modules/workflow/schemas/bulk-schemas";
import { callUpdateJobPipeline } from "@/lib/db/helpers";
import { updateJobDates } from "@/modules/workflow/services/job-service";

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

    return successResponse(result);
});
