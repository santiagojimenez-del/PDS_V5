import { db } from "@/lib/db";
import { jobMeta } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkBillSchema } from "@/modules/workflow/schemas/bulk-schemas";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { updateJobDates } from "@/modules/workflow/services/job-service";

export const POST = withAuth(async (user, req) => {
    const body = await req.json();
    const parsed = bulkBillSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { jobIds, invoiceNumber, billedDate } = parsed.data;
    const billedDateValue = billedDate || new Date().toISOString().split("T")[0];

    const result = await executeBulkAction(
        user,
        "bill",
        "completed",
        jobIds,
        async (jobId: number) => {
            await updateJobDates(jobId, { billed: billedDateValue });
            await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "invoice_number", invoiceNumber);
            await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "invoice_paid", "1");
            await callUpdateJobPipeline(db, jobId);
        }
    );

    return successResponse(result);
});
