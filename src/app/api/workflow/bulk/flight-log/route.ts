import { db } from "@/lib/db";
import { jobMeta } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkFlightLogSchema } from "@/modules/workflow/schemas/bulk-schemas";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { updateJobDates } from "@/modules/workflow/services/job-service";

export const POST = withAuth(async (user, req) => {
    const body = await req.json();
    const parsed = bulkFlightLogSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { jobIds, flownDate, flightLog } = parsed.data;
    const today = new Date().toISOString().split("T")[0];

    const result = await executeBulkAction(
        user,
        "flight_log",
        "processing-deliver",
        jobIds,
        async (jobId: number) => {
            await updateJobDates(jobId, { flown: flownDate, logged: today });
            await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "flight_log", JSON.stringify(flightLog || {}));
            await callUpdateJobPipeline(db, jobId);
        }
    );

    return successResponse(result);
});
