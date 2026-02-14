import { db } from "@/lib/db";
import { jobMeta } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkApproveSchema } from "@/modules/workflow/schemas/bulk-schemas";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";

export const POST = withAuth(async (user, req) => {
    const body = await req.json();
    const parsed = bulkApproveSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const result = await executeBulkAction(
        user,
        "approve",
        "bids",
        parsed.data.jobIds,
        async (jobId: number) => {
            await setMetaValue(
                db,
                jobMeta,
                jobMeta.jobId,
                jobId,
                "approved_flight",
                parsed.data.approvedFlight
            );
            await callUpdateJobPipeline(db, jobId);
        }
    );

    return successResponse(result);
});
