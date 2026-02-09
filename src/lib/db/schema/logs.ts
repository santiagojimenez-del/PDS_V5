import {
  mysqlTable,
  int,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

// ── Logs ─────────────────────────────────────────────────────────────────────
// Note: `action` is SET('CREATE','CHANGE','DELETE') in MySQL.
// Drizzle does not have a native SET type, so we use varchar to read it.
export const logs = mysqlTable("Logs", {
  logId: int("log_id").autoincrement().primaryKey().notNull(),
  who: json("who").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  affectedTable: varchar("affected_table", { length: 255 }).notNull(),
  columns: json("columns"),
});
