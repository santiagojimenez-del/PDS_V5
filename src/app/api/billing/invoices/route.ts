import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { invoices, invoiceLineItems, jobs } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { createInvoiceSchema } from "@/modules/billing/schemas/billing-schemas";
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  getInvoiceWithDetails,
} from "@/modules/billing/services/invoice-service";

/**
 * GET /api/billing/invoices
 * List all invoices with optional filtering
 */
export const GET = withAuth(async (user, req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "25");

    let query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        jobId: invoices.jobId,
        clientId: invoices.clientId,
        clientType: invoices.clientType,
        total: invoices.total,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(page * limit);

    // Filter by status
    if (status && status !== "all") {
      query = query.where(eq(invoices.status, status as any)) as typeof query;
    }

    const results = await query;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices);
    const total = countResult[0]?.count || 0;

    return successResponse({
      invoices: results,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("[Billing API] List invoices error:", error);
    return errorResponse("Failed to list invoices", 500);
  }
});

/**
 * POST /api/billing/invoices
 * Create a new invoice
 */
export const POST = withAuth(async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { jobId, issueDate, dueDate, lineItems, taxRate, notes, termsAndConditions } =
      parsed.data;

    // Verify job exists
    const job = await db
      .select({
        id: jobs.id,
        clientId: jobs.clientId,
        clientType: jobs.clientType,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return errorResponse("Job not found");
    }

    const clientId = parseInt(job[0].clientId || "0");
    const clientType = job[0].clientType || "organization";

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate totals
    const totals = calculateInvoiceTotals(lineItems, taxRate);

    // Create invoice
    const [invoiceResult] = await db.insert(invoices).values({
      invoiceNumber,
      jobId,
      clientId,
      clientType,
      subtotal: totals.subtotal.toString(),
      taxRate: taxRate?.toString() || "0",
      taxAmount: totals.taxAmount.toString(),
      total: totals.total.toString(),
      status: "draft",
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      notes: notes || null,
      termsAndConditions: termsAndConditions || null,
      createdBy: user.id,
    });

    const invoiceId = invoiceResult.insertId;

    // Create line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const amount = item.quantity * item.unitPrice;

      await db.insert(invoiceLineItems).values({
        invoiceId,
        description: item.description,
        productId: item.productId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        amount: amount.toString(),
        sortOrder: i,
      });
    }

    // Return created invoice with details
    const createdInvoice = await getInvoiceWithDetails(invoiceId);

    return successResponse(createdInvoice);
  } catch (error) {
    console.error("[Billing API] Create invoice error:", error);
    return errorResponse("Failed to create invoice", 500);
  }
});
