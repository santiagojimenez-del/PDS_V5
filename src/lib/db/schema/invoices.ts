import { mysqlTable, int, varchar, decimal, datetime, text, index } from "drizzle-orm/mysql-core";
import { jobs } from "./jobs";
import { organization } from "./organizations";
import { users } from "./users";

/**
 * Invoices Table
 * Stores invoice records for billing jobs
 */
export const invoices = mysqlTable(
  "Invoices",
  {
    id: int("id").primaryKey().autoincrement(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    jobId: int("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    clientId: int("client_id").notNull(), // Can reference organization or user
    clientType: varchar("client_type", { length: 20 }).notNull(), // "organization" or "user"

    // Financial details
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"), // Percentage (e.g., 7.5 for 7.5%)
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    // Status tracking
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, paid, overdue, cancelled

    // Dates
    issueDate: datetime("issue_date").notNull(),
    dueDate: datetime("due_date").notNull(),
    paidDate: datetime("paid_date"),

    // Payment details
    paymentMethod: varchar("payment_method", { length: 50 }), // "card", "bank_transfer", "check", "cash"
    paymentReference: varchar("payment_reference", { length: 100 }), // Transaction ID, check number, etc.

    // Additional info
    notes: text("notes"),
    termsAndConditions: text("terms_and_conditions"),

    // Audit
    createdBy: int("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: datetime("created_at").notNull().default(new Date()),
    updatedAt: datetime("updated_at").notNull().default(new Date()),
  },
  (table) => ({
    jobIdx: index("job_idx").on(table.jobId),
    clientIdx: index("client_idx").on(table.clientId, table.clientType),
    statusIdx: index("status_idx").on(table.status),
    invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),
  })
);

/**
 * Invoice Line Items Table
 * Stores individual items/products on an invoice
 */
export const invoiceLineItems = mysqlTable(
  "Invoice_Line_Items",
  {
    id: int("id").primaryKey().autoincrement(),
    invoiceId: int("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    description: varchar("description", { length: 255 }).notNull(),
    productId: int("product_id"), // Optional reference to products table
    quantity: int("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice

    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => ({
    invoiceIdx: index("invoice_idx").on(table.invoiceId),
  })
);

/**
 * Payment Records Table
 * Tracks partial or full payments against invoices
 */
export const payments = mysqlTable(
  "Payments",
  {
    id: int("id").primaryKey().autoincrement(),
    invoiceId: int("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    paymentReference: varchar("payment_reference", { length: 100 }),
    paymentDate: datetime("payment_date").notNull(),

    notes: text("notes"),

    createdBy: int("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: datetime("created_at").notNull().default(new Date()),
  },
  (table) => ({
    invoiceIdx: index("invoice_idx").on(table.invoiceId),
    dateIdx: index("date_idx").on(table.paymentDate),
  })
);
