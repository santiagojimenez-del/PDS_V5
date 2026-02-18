/**
 * Billing Module - TypeScript Types
 */

export interface Invoice {
  id: number;
  invoiceNumber: string;
  jobId: number;
  clientId: number;
  clientType: "organization" | "user";
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  termsAndConditions: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  id: number;
  invoiceId: number;
  description: string;
  productId: number | null;
  quantity: number;
  unitPrice: string;
  amount: string;
  sortOrder: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  paymentReference: string | null;
  paymentDate: Date;
  notes: string | null;
  createdBy: number;
  createdAt: Date;
}

export interface InvoiceWithDetails extends Invoice {
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  jobName: string;
  clientName: string;
  siteName: string;
  totalPaid: string;
  amountDue: string;
}

export interface InvoiceCreateData {
  jobId: number;
  issueDate: string;
  dueDate: string;
  lineItems: {
    description: string;
    productId?: number;
    quantity: number;
    unitPrice: number;
  }[];
  taxRate?: number;
  notes?: string;
  termsAndConditions?: string;
}

export interface PaymentCreateData {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  paymentDate: string;
  notes?: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
}
