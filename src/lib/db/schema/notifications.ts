import {
  mysqlTable,
  int,
  varchar,
  text,
  tinyint,
  timestamp,
} from "drizzle-orm/mysql-core";

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = mysqlTable("Notifications", {
  id: int("id").autoincrement().primaryKey().notNull(),
  userId: int("user_id").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 500 }),
  isRead: tinyint("is_read").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
