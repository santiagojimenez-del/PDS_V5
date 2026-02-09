import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable(
  "Users",
  {
    id: int("ID").autoincrement().primaryKey().notNull(),
    email: varchar("Email", { length: 255 }).notNull(),
    password: text("Password"),
    tokens: json("Tokens"),
  },
  (table) => [uniqueIndex("Email_2").on(table.email)]
);

// ── User_Meta ────────────────────────────────────────────────────────────────
export const userMeta = mysqlTable(
  "User_Meta",
  {
    metaId: int("meta_id").autoincrement().primaryKey().notNull(),
    uid: int("uid").notNull().default(0),
    metaKey: varchar("meta_key", { length: 255 }).notNull(),
    metaValue: text("meta_value"),
  },
  (table) => [uniqueIndex("uid").on(table.uid, table.metaKey)]
);
