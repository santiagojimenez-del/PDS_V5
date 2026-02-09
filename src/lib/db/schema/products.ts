import {
  mysqlTable,
  int,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

// ── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("Products", {
  id: int("id").autoincrement().primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  deliverableTemplate: varchar("deliverable_template", { length: 255 }),
  metaDefaults: json("meta_defaults"),
  configuration: json("configuration"),
});
