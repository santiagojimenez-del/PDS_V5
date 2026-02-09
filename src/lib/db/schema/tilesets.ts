import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  tinyint,
} from "drizzle-orm/mysql-core";

// ── Tilesets ─────────────────────────────────────────────────────────────────
export const tilesets = mysqlTable("Tilesets", {
  id: int("id").autoincrement().primaryKey().notNull(),
  createdBy: int("createdBy"),
  published: tinyint("published").default(0),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  path: text("path").notNull(),
  attribution: json("attribution"),
  preset: varchar("preset", { length: 255 }),
  tilesetOptions: text("tileset_options"),
});
