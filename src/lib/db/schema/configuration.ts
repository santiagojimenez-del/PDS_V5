import {
  mysqlTable,
  varchar,
  text,
  primaryKey,
} from "drizzle-orm/mysql-core";

// ── Configuration ────────────────────────────────────────────────────────────
export const configuration = mysqlTable(
  "Configuration",
  {
    application: varchar("Application", { length: 255 }).notNull().default("*"),
    name: varchar("Name", { length: 255 }).notNull(),
    value: text("Value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.application, table.name] })]
);
