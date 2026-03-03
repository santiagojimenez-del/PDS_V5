import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { ROLES } from "@/lib/constants";

/**
 * GET /api/health
 *
 * System health check — Admin only.
 * Does NOT expose sensitive configuration values (connection strings, secrets).
 */
export const GET = withRole([ROLES.ADMIN, ROLES.DEVELOPER], async () => {
  const checks: Record<string, string> = {};

  // Only report presence — never expose values
  checks.DATABASE_URL    = process.env.DATABASE_URL    ? "set" : "MISSING";
  checks.DATABASE_SSL    = process.env.DATABASE_SSL    || "not set";
  checks.AES_KEY         = process.env.AES_KEY         ? "set" : "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";
  checks.NODE_ENV        = process.env.NODE_ENV        || "not set";

  // Test DB connection — only report success/failure and user count
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.default.createConnection({
      uri: process.env.DATABASE_URL!,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 5000,
    });
    const [rows] = await conn.query("SELECT COUNT(*) as cnt FROM Users") as any;
    checks.db_connection = `OK - ${rows[0].cnt} users`;
    await conn.end();
  } catch (err: any) {
    checks.db_connection = `FAILED: ${err.message}`;
  }

  return NextResponse.json(checks);
});
