import {
  mysqlTable,
  int,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

// ── Requests ─────────────────────────────────────────────────────────────────
// Note: `method` is SET('GET','POST','DELETE') in MySQL.
// Drizzle does not have a native SET type, so we use varchar to read it.
export const requests = mysqlTable("Requests", {
  id: int("id").autoincrement().primaryKey().notNull(),
  token: json("token"),
  user: json("user").notNull(),
  pageId: varchar("pageId", { length: 255 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  query: json("query"),
  altData: json("altData"),
});

// ── Shares ───────────────────────────────────────────────────────────────────
export const shares = mysqlTable("Shares", {
  id: int("id").autoincrement().primaryKey().notNull(),
  token: json("token").notNull(),
  user: json("user").notNull(),
  pageId: int("pageId").notNull(),
  requestToken: varchar("requestToken", { length: 350 }),
});
