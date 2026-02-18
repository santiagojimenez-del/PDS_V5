import { mysqlTable, int, varchar, boolean, datetime, text, unique, index } from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * Pilot Availability Table
 * Stores recurring weekly availability for pilots
 */
export const pilotAvailability = mysqlTable(
  "Pilot_Availability",
  {
    id: int("id").primaryKey().autoincrement(),
    pilotId: int("pilot_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: int("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
    startTime: varchar("start_time", { length: 5 }).notNull(), // Format: "09:00"
    endTime: varchar("end_time", { length: 5 }).notNull(), // Format: "17:00"
    isAvailable: boolean("is_available").notNull().default(true),
    notes: text("notes"),
    createdAt: datetime("created_at").notNull().default(new Date()),
    updatedAt: datetime("updated_at").notNull().default(new Date()),
  },
  (table) => ({
    // Unique constraint: one availability record per pilot per day
    uniquePilotDay: unique().on(table.pilotId, table.dayOfWeek),
    // Index for faster queries
    pilotIdx: index("pilot_idx").on(table.pilotId),
  })
);

/**
 * Pilot Blackout Dates Table
 * Stores specific dates when pilots are unavailable (vacations, etc.)
 */
export const pilotBlackout = mysqlTable(
  "Pilot_Blackout",
  {
    id: int("id").primaryKey().autoincrement(),
    pilotId: int("pilot_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    reason: varchar("reason", { length: 255 }),
    createdAt: datetime("created_at").notNull().default(new Date()),
  },
  (table) => ({
    // Index for faster date range queries
    pilotIdx: index("pilot_idx").on(table.pilotId),
    dateIdx: index("date_idx").on(table.startDate, table.endDate),
  })
);

/**
 * Pilot Assignments View
 * Not a real table - use Job_Meta with key 'persons_assigned'
 * This is just for TypeScript reference
 */
export type PilotAssignment = {
  jobId: number;
  pilotId: number;
  scheduledDate: string;
  scheduledFlight: string;
};
