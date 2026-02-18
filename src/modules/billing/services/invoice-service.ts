import { db } from "@/lib/db";
import { invoices, invoiceLineItems, payments, jobs, organization, users, userMeta } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import type { InvoiceWithDetails, InvoiceSummary } from "../types";
import { format } from "date-fns";

/**
 * Generate a unique invoice number
 * Format: INV-YYYY-NNNN (e.g., INV-2026-0001)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Get the latest invoice for this year
  const latestInvoice = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${prefix + "%"}`)
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  let nextNumber = 1;
  if (latestInvoice.length > 0) {
    const lastNumber = parseInt(latestInvoice[0].invoiceNumber.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: { quantity: number; unitPrice: number }[],
  taxRate: number = 0
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Get invoice with full details
 */
export async function getInvoiceWithDetails(invoiceId: number): Promise<InvoiceWithDetails | null> {
  // Get invoice
  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (invoiceRows.length === 0) return null;

  const invoice = invoiceRows[0];

  // Get line items
  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.sortOrder);

  // Get payments
  const paymentsData = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(desc(payments.paymentDate));

  // Get job details
  const job = await db
    .select({
      id: jobs.id,
      name: jobs.name,
      siteId: jobs.siteId,
      clientId: jobs.clientId,
      clientType: jobs.clientType,
    })
    .from(jobs)
    .where(eq(jobs.id, invoice.jobId))
    .limit(1);

  let jobName = "Unknown Job";
  let siteName = "Unknown Site";
  let clientName = "Unknown Client";

  if (job.length > 0) {
    jobName = job[0].name || `Job #${job[0].id}`;

    // Get site name (simplified)
    siteName = "Site"; // Would need to join sites table

    // Get client name
    if (invoice.clientType === "organization") {
      const org = await db
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, invoice.clientId))
        .limit(1);
      if (org.length > 0) clientName = org[0].name;
    }
  }

  // Calculate totals
  const totalPaid = paymentsData.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );
  const amountDue = parseFloat(invoice.total.toString()) - totalPaid;

  return {
    ...invoice,
    subtotal: invoice.subtotal.toString(),
    taxRate: invoice.taxRate?.toString() || "0",
    taxAmount: invoice.taxAmount?.toString() || "0",
    total: invoice.total.toString(),
    lineItems: lineItems.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      amount: item.amount.toString(),
    })),
    payments: paymentsData.map((p) => ({
      ...p,
      amount: p.amount.toString(),
    })),
    jobName,
    siteName,
    clientName,
    totalPaid: totalPaid.toFixed(2),
    amountDue: amountDue.toFixed(2),
  } as InvoiceWithDetails;
}

/**
 * Get invoice summary statistics
 */
export async function getInvoiceSummary(): Promise<InvoiceSummary> {
  const allInvoices = await db
    .select({
      id: invoices.id,
      total: invoices.total,
      status: invoices.status,
      dueDate: invoices.dueDate,
    })
    .from(invoices);

  const totalInvoices = allInvoices.length;
  const totalBilled = allInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total.toString()),
    0
  );

  // Get all payments
  const allPayments = await db
    .select({
      invoiceId: payments.invoiceId,
      amount: payments.amount,
    })
    .from(payments);

  // Calculate total paid
  const totalPaid = allPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  // Group payments by invoice
  const paymentsByInvoice = allPayments.reduce((map, p) => {
    if (!map[p.invoiceId]) map[p.invoiceId] = 0;
    map[p.invoiceId] += parseFloat(p.amount.toString());
    return map;
  }, {} as Record<number, number>);

  // Calculate overdue
  const now = new Date();
  let overdueCount = 0;
  let overdueAmount = 0;

  for (const invoice of allInvoices) {
    if (invoice.status !== "paid" && new Date(invoice.dueDate) < now) {
      overdueCount++;
      const paid = paymentsByInvoice[invoice.id] || 0;
      const due = parseFloat(invoice.total.toString()) - paid;
      if (due > 0) {
        overdueAmount += due;
      }
    }
  }

  return {
    totalInvoices,
    totalBilled: Math.round(totalBilled * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOutstanding: Math.round((totalBilled - totalPaid) * 100) / 100,
    overdueCount,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
  };
}

/**
 * Update invoice status based on payments
 */
export async function updateInvoiceStatus(invoiceId: number): Promise<void> {
  const invoice = await db
    .select({ total: invoices.total, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (invoice.length === 0) return;

  const totalAmount = parseFloat(invoice[0].total.toString());

  const paymentsData = await db
    .select({ amount: payments.amount })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  const totalPaid = paymentsData.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  // If fully paid, update status
  if (totalPaid >= totalAmount && invoice[0].status !== "paid") {
    await db
      .update(invoices)
      .set({
        status: "paid",
        paidDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  }
}
