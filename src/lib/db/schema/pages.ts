import {
  mysqlTable,
  int,
  varchar,
  json,
  float,
  tinyint,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/mysql-core";

// ── Pages ────────────────────────────────────────────────────────────────────
export const pages = mysqlTable(
  "Pages",
  {
    pageId: int("PageID").autoincrement().primaryKey().notNull(),
    application: varchar("Application", { length: 255 }).notNull(),
    page: varchar("Page", { length: 255 }).notNull(),
    wrapper: varchar("Wrapper", { length: 255 }).notNull().default("standard"),
    template: varchar("Template", { length: 255 }),
    priority: float("Priority").notNull(),
    hidden: tinyint("Hidden").notNull().default(0),
    shareable: tinyint("Shareable").notNull().default(0),
    roleAccess: json("RoleAccess"),
    permissionAccess: json("PermissionAccess"),
    maintenance: json("Maintenance"),
    design: json("Design").notNull(),
    navGroup: json("NavGroup"),
    breadcrumbs: json("Breadcrumbs"),
  },
  (table) => [
    uniqueIndex("UniquePage").on(table.application, table.page),
  ]
);

// ── Templates ────────────────────────────────────────────────────────────────
export const templates = mysqlTable("Templates", {
  name: varchar("name", { length: 255 }).primaryKey().notNull(),
  pageOverwrite: json("pageOverwrite"),
});
