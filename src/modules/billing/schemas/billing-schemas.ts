import { z } from "zod";

/**
 * Billing Module - Zod Validation Schemas
 */

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(255),
  productId: z.number().int().positive().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

export const createInvoiceSchema = z.object({
  jobId: z.number().int().positive("Job ID is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  lineItems: z
    .array(invoiceLineItemSchema)
    .min(1, "At least one line item is required"),
  taxRate: z.number().min(0).max(100).optional().default(0),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
}).refine(
  (data) => {
    const issueDate = new Date(data.issueDate);
    const dueDate = new Date(data.dueDate);
    return dueDate >= issueDate;
  },
  {
    message: "Due date must be on or after issue date",
    path: ["dueDate"],
  }
);

export const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

export const invoiceFilterSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "all"]).optional(),
  clientId: z.number().int().positive().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(1).max(100).optional().default(25),
});
