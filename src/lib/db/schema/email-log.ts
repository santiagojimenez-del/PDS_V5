import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  datetime,
  mysqlEnum,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ── Email_Log ────────────────────────────────────────────────────────────────
export const emailLog = mysqlTable("Email_Log", {
  id: int("id").autoincrement().primaryKey().notNull(),

  // Email details
  provider: mysqlEnum("provider", [
    "ethereal",
    "resend",
    "sendgrid",
    "console",
  ]).notNull(),
  template: varchar("template", { length: 50 }), // null if raw email
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  toName: varchar("to_name", { length: 255 }),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),

  // Status
  status: mysqlEnum("status", ["pending", "sent", "failed"]).notNull().default("pending"),
  messageId: varchar("message_id", { length: 255 }), // Provider's message ID

  // Error tracking
  error: text("error"),
  retryCount: int("retry_count").notNull().default(0),

  // Metadata
  templateData: json("template_data"), // Data used to render template
  metadata: json("metadata"), // Additional context (userId, jobId, etc.)
  previewUrl: varchar("preview_url", { length: 500 }), // Ethereal preview URL

  // Timestamps
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  sentAt: datetime("sent_at"),
});
