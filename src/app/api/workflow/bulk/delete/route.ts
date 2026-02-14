import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { executeBulkAction } from "@/modules/workflow/services/bulk-service";
import { bulkDeleteSchema } from "@/modules/workflow/schemas/bulk-schemas";

export const POST = withAuth(async (user, req) => {
    const body = await req.json();
    const parsed = bulkDeleteSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { jobIds } = parsed.data;

    const result = await executeBulkAction(
        user,
        "delete",
        "none", // Pipeline stage is not relevant for deletion
        jobIds,
        async (jobId: number) => {
            // Delete meta first (FK constraint)
            await db.delete(jobMeta).where(eq(jobMeta.jobId, jobId));
            // Delete the job
            await db.delete(jobs).where(eq(jobs.id, jobId));
        }
    );

    return successResponse(result);
});
