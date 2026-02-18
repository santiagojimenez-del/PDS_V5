import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { invoices, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { recordPaymentSchema } from "@/modules/billing/schemas/billing-schemas";
import { updateInvoiceStatus } from "@/modules/billing/services/invoice-service";

function extractInvoiceId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const idIndex = segments.findIndex((s) => s === "invoices") + 1;
  const id = parseInt(segments[idIndex]);
  return isNaN(id) ? null : id;
}

/**
 * POST /api/billing/invoices/[id]/payments
 * Record a payment against an invoice
 */
export const POST = withAuth(async (user, req: NextRequest) => {
  const invoiceId = extractInvoiceId(req);
  if (!invoiceId) return errorResponse("Invalid invoice ID");

  try {
    // Verify invoice exists
    const invoice = await db
      .select({ id: invoices.id, total: invoices.total, status: invoices.status })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (invoice.length === 0) {
      return notFoundResponse("Invoice not found");
    }

    if (invoice[0].status === "cancelled") {
      return errorResponse("Cannot add payment to cancelled invoice");
    }

    const body = await req.json();
    body.invoiceId = invoiceId; // Ensure invoiceId matches URL

    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { amount, paymentMethod, paymentReference, paymentDate, notes } = parsed.data;

    // Check if payment amount exceeds remaining balance
    const existingPayments = await db
      .select({ amount: payments.amount })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    const totalPaid = existingPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    const invoiceTotal = parseFloat(invoice[0].total.toString());
    const remaining = invoiceTotal - totalPaid;

    if (amount > remaining + 0.01) {
      // Allow small rounding
      return errorResponse(
        `Payment amount ($${amount}) exceeds remaining balance ($${remaining.toFixed(2)})`
      );
    }

    // Record payment
    const [result] = await db.insert(payments).values({
      invoiceId,
      amount: amount.toString(),
      paymentMethod,
      paymentReference: paymentReference || null,
      paymentDate: new Date(paymentDate),
      notes: notes || null,
      createdBy: user.id,
    });

    // Update invoice status if fully paid
    await updateInvoiceStatus(invoiceId);

    return successResponse({
      id: result.insertId,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    console.error("[Billing API] Record payment error:", error);
    return errorResponse("Failed to record payment", 500);
  }
});

/**
 * GET /api/billing/invoices/[id]/payments
 * Get all payments for an invoice
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const invoiceId = extractInvoiceId(req);
  if (!invoiceId) return errorResponse("Invalid invoice ID");

  try {
    const paymentsData = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(payments.paymentDate);

    return successResponse({ payments: paymentsData });
  } catch (error) {
    console.error("[Billing API] Get payments error:", error);
    return errorResponse("Failed to get payments", 500);
  }
});
