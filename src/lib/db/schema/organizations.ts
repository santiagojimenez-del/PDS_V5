import {
  mysqlTable,
  int,
  varchar,
  text,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ── Organization ─────────────────────────────────────────────────────────────
export const organization = mysqlTable("Organization", {
  id: int("id").autoincrement().primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

// ── Organization_Meta ────────────────────────────────────────────────────────
export const organizationMeta = mysqlTable(
  "Organization_Meta",
  {
    metaId: int("meta_id").autoincrement().primaryKey().notNull(),
    orgId: int("org_id").notNull(),
    metaKey: varchar("meta_key", { length: 255 }).notNull(),
    metaValue: text("meta_value").notNull(),
  },
  (table) => [uniqueIndex("org_id_2").on(table.orgId, table.metaKey)]
);
