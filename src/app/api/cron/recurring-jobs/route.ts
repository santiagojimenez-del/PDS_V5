import { NextRequest, NextResponse } from "next/server";
import { processActiveTemplates } from "@/modules/recurring/services/recurring-service";

/**
 * POST /api/cron/recurring-jobs
 * Worker endpoint called by Vercel Cron to process recurring job templates
 *
 * This endpoint:
 * 1. Generates new occurrences for active templates
 * 2. Creates jobs from due occurrences (past occurrence dates)
 * 3. Returns processing statistics
 */
export async function POST(req: NextRequest) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = req.headers.get("authorization");

    // In production, verify the CRON_SECRET
    if (process.env.NODE_ENV === "production") {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("[CRON] Starting recurring jobs processing...");
    const startTime = Date.now();

    // Process all active templates
    const result = await processActiveTemplates();

    const duration = Date.now() - startTime;

    console.log("[CRON] Recurring jobs processing completed:", {
      duration: `${duration}ms`,
      processed: result.processed,
      occurrences: result.totalOccurrences,
      jobs: result.totalJobs,
      errors: result.errors.length,
    });

    // Log errors if any
    if (result.errors.length > 0) {
      console.error("[CRON] Errors during processing:", result.errors);
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        occurrencesGenerated: result.totalOccurrences,
        jobsCreated: result.totalJobs,
        errors: result.errors,
        duration,
      },
    });
  } catch (error) {
    console.error("[CRON] Fatal error processing recurring jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/recurring-jobs
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Recurring jobs worker endpoint is ready",
    timestamp: new Date().toISOString(),
  });
}
