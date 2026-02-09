import {
  mysqlTable,
  varchar,
  float,
  tinyint,
  json,
} from "drizzle-orm/mysql-core";

// ── Permissions ──────────────────────────────────────────────────────────────
export const permissions = mysqlTable("Permissions", {
  name: varchar("name", { length: 50 }).primaryKey().notNull(),
  category: varchar("category", { length: 50 }),
  label: varchar("label", { length: 50 }),
  description: varchar("description", { length: 255 }),
  priority: float("priority").notNull().default(3),
  hidden: tinyint("hidden").notNull().default(0),
  enforce: tinyint("enforce").notNull().default(1),
  eventWl: json("event_wl"),
  arrayKeyWl: json("array_key_wl"),
  htmlIdWl: json("html_id_wl"),
  jsWhitelist: json("js_whitelist"),
});
