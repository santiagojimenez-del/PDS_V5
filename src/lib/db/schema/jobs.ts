import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  longtext,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = mysqlTable("Jobs", {
  id: int("id").autoincrement().primaryKey().notNull(),
  pipeline: varchar("pipeline", { length: 255 }),
  createdBy: int("createdBy").notNull(),
  name: varchar("name", { length: 255 }),
  client: json("client"),
  // GENERATED COLUMN (STORED) - read-only, computed by MySQL:
  //   json_unquote(json_extract(client, '$.id'))
  clientId: varchar("client_id", { length: 255 }),
  // GENERATED COLUMN (STORED) - read-only, computed by MySQL:
  //   ifnull(json_unquote(json_extract(client, '$.type')), NULL)
  clientType: varchar("client_type", { length: 50 }),
  dates: json("dates").notNull(),
  siteId: int("siteId").notNull(),
  products: json("products").notNull(),
  recurringOccurrenceId: int("recurring_occurrence_id"),
});

// ── Job_Meta ─────────────────────────────────────────────────────────────────
export const jobMeta = mysqlTable(
  "Job_Meta",
  {
    metaId: int("meta_id").autoincrement().primaryKey().notNull(),
    jobId: int("job_id").notNull(),
    metaKey: varchar("meta_key", { length: 255 }).notNull(),
    metaValue: text("meta_value").notNull(),
  },
  (table) => [uniqueIndex("job_id").on(table.jobId, table.metaKey)]
);

// ── Job_Deliverable ──────────────────────────────────────────────────────────
export const jobDeliverable = mysqlTable(
  "Job_Deliverable",
  {
    metaId: int("meta_id").autoincrement().primaryKey().notNull(),
    jobProductId: varchar("job_product_id", { length: 255 }).notNull(),
    metaKey: varchar("meta_key", { length: 255 }).notNull(),
    metaValue: longtext("meta_value").notNull(),
  },
  (table) => [
    uniqueIndex("job_id_2").on(table.jobProductId, table.metaKey),
  ]
);
