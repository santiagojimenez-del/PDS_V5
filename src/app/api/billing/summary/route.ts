import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { getInvoiceSummary } from "@/modules/billing/services/invoice-service";

/**
 * GET /api/billing/summary
 * Get billing summary statistics
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  try {
    const summary = await getInvoiceSummary();
    return successResponse(summary);
  } catch (error) {
    console.error("[Billing API] Get summary error:", error);
    return errorResponse("Failed to get billing summary", 500);
  }
});
