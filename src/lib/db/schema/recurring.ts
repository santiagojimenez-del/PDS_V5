import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  tinyint,
  datetime,
  decimal,
  bigint,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ── Recurring_Job_Templates ──────────────────────────────────────────────────
export const recurringJobTemplates = mysqlTable("Recurring_Job_Templates", {
  id: int("id").autoincrement().primaryKey().notNull(),
  active: tinyint("active").notNull().default(1),
  isManual: tinyint("is_manual").notNull().default(0),
  name: varchar("name", { length: 255 }).notNull(),
  siteId: int("site_id").notNull(),
  clientType: mysqlEnum("client_type", ["user", "organization"]).notNull(),
  clientId: int("client_id").notNull(),
  rrule: text("rrule"),
  timezone: varchar("timezone", { length: 50 }).notNull().default("America/New_York"),
  dtstart: datetime("dtstart"),
  dtend: datetime("dtend"),
  windowDays: int("window_days").notNull().default(60),
  lastGeneratedThrough: datetime("last_generated_through"),
  amountPayable: decimal("amount_payable", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  notes: text("notes"),
  products: json("products").notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ── Recurring_Job_Occurrences ────────────────────────────────────────────────
export const recurringJobOccurrences = mysqlTable(
  "Recurring_Job_Occurrences",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    templateId: int("template_id").notNull(),
    occurrenceAt: datetime("occurrence_at").notNull(),
    status: mysqlEnum("status", [
      "planned",
      "created",
      "skipped",
      "cancelled",
    ])
      .notNull()
      .default("planned"),
    jobId: int("job_id"),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("uk_template_occurrence").on(
      table.templateId,
      table.occurrenceAt
    ),
  ]
);

// ── Recurring_Job_Template_Attachments ─────────────────────────────────────
export const recurringJobTemplateAttachments = mysqlTable(
  "Recurring_Job_Template_Attachments",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    templateId: int("template_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    type: varchar("type", { length: 100 }),
    size: bigint("size", { mode: "number" }),
  }
);
