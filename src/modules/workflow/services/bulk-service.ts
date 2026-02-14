import { db } from "@/lib/db";
import { bulkActionLog } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { AuthUser } from "@/modules/auth/types";

export interface BulkActionResult {
    total: number;
    succeeded: number;
    failed: number;
    errors: { jobId: number; error: string }[];
}

type BulkActionType = "approve" | "flight_log" | "deliver" | "bill" | "delete";

/**
 * Generic wrapper for executing bulk actions on jobs.
 * Handles logging, progress tracking, and error isolation.
 */
export async function executeBulkAction(
    user: AuthUser,
    actionType: BulkActionType,
    pipeline: string,
    jobIds: number[],
    actionFn: (jobId: number) => Promise<void>
): Promise<BulkActionResult> {
    // 1. Create log entry
    const [logResult] = await db.insert(bulkActionLog).values({
        actionType,
        pipeline,
        jobIds,
        jobCount: jobIds.length,
        performedBy: user.id,
        status: "started",
    });

    const logId = logResult.insertId;

    const result: BulkActionResult = {
        total: jobIds.length,
        succeeded: 0,
        failed: 0,
        errors: [],
    };

    // 2. Iterate over each jobId
    for (const jobId of jobIds) {
        try {
            await actionFn(jobId);
            result.succeeded++;
        } catch (error: any) {
            result.failed++;
            result.errors.push({
                jobId,
                error: error.message || "Unknown error",
            });
        }
    }

    // 3. Determine final status
    let finalStatus: "completed" | "failed" | "partial" = "completed";
    if (result.failed === result.total) {
        finalStatus = "failed";
    } else if (result.failed > 0) {
        finalStatus = "partial";
    }

    // 4. Update log entry
    await db
        .update(bulkActionLog)
        .set({
            status: finalStatus,
            errorDetails: result.errors.length > 0 ? result.errors : null,
            completedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(bulkActionLog.id, logId));

    return result;
}
