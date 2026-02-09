import {
  mysqlTable,
  int,
  varchar,
  json,
  datetime,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ── Bulk_Action_Log ──────────────────────────────────────────────────────────
export const bulkActionLog = mysqlTable("Bulk_Action_Log", {
  id: int("id").autoincrement().primaryKey().notNull(),
  actionType: mysqlEnum("action_type", [
    "approve",
    "flight_log",
    "deliver",
    "bill",
    "delete",
  ]).notNull(),
  pipeline: varchar("pipeline", { length: 50 }).notNull(),
  jobIds: json("job_ids").notNull(),
  jobCount: int("job_count").notNull(),
  performedBy: int("performed_by").notNull(),
  status: mysqlEnum("status", [
    "started",
    "completed",
    "failed",
    "partial",
  ])
    .notNull()
    .default("started"),
  errorDetails: json("error_details"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  completedAt: datetime("completed_at"),
});
