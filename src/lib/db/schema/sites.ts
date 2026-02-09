import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
} from "drizzle-orm/mysql-core";

// ── Sites ────────────────────────────────────────────────────────────────────
export const sites = mysqlTable("Sites", {
  id: int("id").autoincrement().primaryKey().notNull(),
  createdBy: int("createdBy").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  coordinates: json("coordinates").notNull(),
  boundary: json("boundary"),
});
