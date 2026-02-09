import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ── Delivery_Email_Outbox ────────────────────────────────────────────────────
export const deliveryEmailOutbox = mysqlTable(
  "Delivery_Email_Outbox",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    clientType: mysqlEnum("client_type", ["user", "organization"]).notNull(),
    clientId: int("client_id").notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    recipientName: varchar("recipient_name", { length: 255 }),
    sendAfter: datetime("send_after").notNull(),
    status: mysqlEnum("status", ["pending", "sending", "sent", "failed"])
      .notNull()
      .default("pending"),
    errorMessage: text("error_message"),
    sentAt: datetime("sent_at"),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("uk_batch_recipient").on(
      table.clientType,
      table.clientId,
      table.recipientEmail,
      table.sendAfter
    ),
  ]
);

// ── Delivery_Email_Items ─────────────────────────────────────────────────────
export const deliveryEmailItems = mysqlTable("Delivery_Email_Items", {
  id: int("id").autoincrement().primaryKey().notNull(),
  outboxId: int("outbox_id").notNull(),
  jobId: int("job_id").notNull(),
  productId: int("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  deliveryType: mysqlEnum("delivery_type", [
    "link",
    "tileset",
    "file",
    "other",
  ])
    .notNull()
    .default("link"),
  deliveryContent: text("delivery_content"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
