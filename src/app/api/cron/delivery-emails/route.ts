/**
 * POST /api/cron/delivery-emails
 *
 * HTTP endpoint to trigger the delivery email worker manually
 * or via an external cron service (Vercel Cron, etc.).
 *
 * The same worker also runs automatically every 60s inside server.ts.
 * This endpoint exists for:
 *  - Manual triggering during development
 *  - External cron services that call via HTTP
 *  - Health checks (GET)
 */

import { NextRequest, NextResponse } from "next/server";
import { processDeliveryEmailQueue } from "@/modules/email/services/delivery-email-worker";

export async function POST(req: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log("[CRON/DeliveryEmail] Starting delivery email queue processing...");
    const start  = Date.now();
    const result = await processDeliveryEmailQueue();
    const ms     = Date.now() - start;

    console.log("[CRON/DeliveryEmail] Completed:", { ...result, ms });

    if (result.errors.length > 0) {
      console.error("[CRON/DeliveryEmail] Errors:", result.errors);
    }

    return NextResponse.json({ success: true, data: { ...result, durationMs: ms } });
  } catch (err) {
    console.error("[CRON/DeliveryEmail] Fatal error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Delivery email worker endpoint is ready",
    timestamp: new Date().toISOString(),
  });
}
