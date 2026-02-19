import { db } from "@/lib/db";
import { jobMeta } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkScheduleSchema } from "@/modules/workflow/schemas/bulk-schemas";
import { setMetaValue, callUpdateJobPipeline } from "@/lib/db/helpers";
import { updateJobDates, getJobById } from "@/modules/workflow/services/job-service";
import { sendPilotNotifications } from "@/modules/workflow/services/workflow-emails";

export const POST = withAuth(async (user, req) => {
    const body = await req.json();
    const parsed = bulkScheduleSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { jobIds, scheduledDate, scheduledFlight, personsAssigned } = parsed.data;

    const result = await executeBulkAction(
        user,
        "approve",
        "scheduled",
        jobIds,
        async (jobId: number) => {
            await updateJobDates(jobId, { scheduled: scheduledDate });
            await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "scheduled_flight", scheduledFlight);
            await setMetaValue(
                db,
                jobMeta,
                jobMeta.jobId,
                jobId,
                "persons_assigned",
                JSON.stringify(personsAssigned)
            );
            await callUpdateJobPipeline(db, jobId);
        }
    );

    // Fire-and-forget: notify pilots for each successfully scheduled job
    if (personsAssigned.length > 0 && result.succeeded > 0) {
        const succeededIds = jobIds.filter((id) => !result.errors.find((e) => e.jobId === id));
        Promise.allSettled(
            succeededIds.map(async (jobId) => {
                const job = await getJobById(jobId);
                if (job) await sendPilotNotifications(personsAssigned, job, "scheduled", scheduledDate);
            })
        ).catch(() => {});
    }

    return successResponse(result);
});
