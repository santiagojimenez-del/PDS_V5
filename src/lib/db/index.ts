import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  ssl: process.env.DATABASE_SSL?.trim() === "true" ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

export type Database = typeof db;
