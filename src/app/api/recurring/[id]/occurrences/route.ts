import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { recurringJobOccurrences, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) =>
  withAuth(async (_user) => {
    try {
      const { id } = await context.params;
      const templateId = parseInt(id, 10);
      if (isNaN(templateId)) return errorResponse("Invalid template ID", 400);

      const rows = await db
        .select({
          id: recurringJobOccurrences.id,
          occurrenceAt: recurringJobOccurrences.occurrenceAt,
          status: recurringJobOccurrences.status,
          jobId: recurringJobOccurrences.jobId,
          jobName: jobs.name,
          jobPipeline: jobs.pipeline,
        })
        .from(recurringJobOccurrences)
        .leftJoin(jobs, eq(recurringJobOccurrences.jobId, jobs.id))
        .where(eq(recurringJobOccurrences.templateId, templateId))
        .orderBy(recurringJobOccurrences.occurrenceAt);

      return successResponse({ occurrences: rows });
    } catch (error: any) {
      console.error("[API] Get occurrences error:", error);
      return errorResponse(error.message || "Failed to fetch occurrences", 500);
    }
  })(req);
