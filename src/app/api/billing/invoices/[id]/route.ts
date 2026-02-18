import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { updateInvoiceSchema } from "@/modules/billing/schemas/billing-schemas";
import { getInvoiceWithDetails } from "@/modules/billing/services/invoice-service";

function extractInvoiceId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const id = parseInt(segments[segments.length - 1]);
  return isNaN(id) ? null : id;
}

/**
 * GET /api/billing/invoices/[id]
 * Get invoice details
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const invoiceId = extractInvoiceId(req);
  if (!invoiceId) return errorResponse("Invalid invoice ID");

  try {
    const invoice = await getInvoiceWithDetails(invoiceId);

    if (!invoice) {
      return notFoundResponse("Invoice not found");
    }

    return successResponse(invoice);
  } catch (error) {
    console.error("[Billing API] Get invoice error:", error);
    return errorResponse("Failed to get invoice", 500);
  }
});

/**
 * PATCH /api/billing/invoices/[id]
 * Update invoice
 */
export const PATCH = withAuth(async (user, req: NextRequest) => {
  const invoiceId = extractInvoiceId(req);
  if (!invoiceId) return errorResponse("Invalid invoice ID");

  try {
    const existing = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return notFoundResponse("Invoice not found");
    }

    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.dueDate) updateData.dueDate = new Date(parsed.data.dueDate);
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.termsAndConditions !== undefined)
      updateData.termsAndConditions = parsed.data.termsAndConditions;

    await db.update(invoices).set(updateData).where(eq(invoices.id, invoiceId));

    const updated = await getInvoiceWithDetails(invoiceId);
    return successResponse(updated);
  } catch (error) {
    console.error("[Billing API] Update invoice error:", error);
    return errorResponse("Failed to update invoice", 500);
  }
});

/**
 * DELETE /api/billing/invoices/[id]
 * Delete invoice (only if draft)
 */
export const DELETE = withAuth(async (_user, req: NextRequest) => {
  const invoiceId = extractInvoiceId(req);
  if (!invoiceId) return errorResponse("Invalid invoice ID");

  try {
    const existing = await db
      .select({ id: invoices.id, status: invoices.status })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (existing.length === 0) {
      return notFoundResponse("Invoice not found");
    }

    // Only allow deleting draft invoices
    if (existing[0].status !== "draft") {
      return errorResponse("Can only delete draft invoices");
    }

    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    return successResponse({ deleted: invoiceId });
  } catch (error) {
    console.error("[Billing API] Delete invoice error:", error);
    return errorResponse("Failed to delete invoice", 500);
  }
});
