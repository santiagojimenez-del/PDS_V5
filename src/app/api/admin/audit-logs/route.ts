/**
 * GET /api/admin/audit-logs
 *
 * Fetch audit logs with pagination and filtering.
 *
 * The Logs table schema: logId, who (JSON), action, affectedTable, columns, createdAt
 * `who` contains: { id, email, name? }
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { logs } from "@/lib/db/schema";
import { desc, like, or, sql } from "drizzle-orm";

export const GET = withAuth(async (user, request: NextRequest) => {
  // Only admins (role 0) can access audit logs
  if (!user.roles.includes(0)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
    const action = searchParams.get("action");
    const search = searchParams.get("search");

    const baseQuery = db
      .select({
        id: logs.logId,
        action: logs.action,
        resource: logs.affectedTable,
        resourceId: sql<number | null>`NULL`,
        userId: sql<number>`CAST(JSON_UNQUOTE(JSON_EXTRACT(${logs.who}, '$.id')) AS UNSIGNED)`,
        userName: sql<string>`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${logs.who}, '$.name')), '')`,
        userEmail: sql<string>`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${logs.who}, '$.email')), '')`,
        ipAddress: sql<string | null>`NULL`,
        userAgent: sql<string | null>`NULL`,
        metadata: logs.columns,
        createdAt: logs.createdAt,
      })
      .from(logs);

    // Build where conditions
    const conditions: ReturnType<typeof like>[] = [];

    if (action && action !== "all") {
      conditions.push(like(logs.action, `%${action}%`));
    }

    if (search) {
      // Search across table name, action, and who JSON (email/name)
      conditions.push(
        or(
          like(logs.affectedTable, `%${search}%`),
          like(logs.action, `%${search}%`),
          sql`JSON_UNQUOTE(JSON_EXTRACT(${logs.who}, '$.email')) LIKE ${`%${search}%`}`,
          sql`JSON_UNQUOTE(JSON_EXTRACT(${logs.who}, '$.name')) LIKE ${`%${search}%`}`
        ) as ReturnType<typeof like>
      );
    }

    const whereClause = conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
      ? sql`(${sql.join(conditions, sql` AND `)})`
      : undefined;

    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(logs);

    if (whereClause) {
      const logRows = await baseQuery
        .where(whereClause)
        .orderBy(desc(logs.logId))
        .limit(limit)
        .offset(page * limit);

      const countRows = await countQuery.where(whereClause);
      const total = countRows[0]?.count || 0;

      return NextResponse.json({
        success: true,
        data: { logs: logRows, total, page, limit },
      });
    }

    const [logRows, countRows] = await Promise.all([
      baseQuery.orderBy(desc(logs.logId)).limit(limit).offset(page * limit),
      countQuery,
    ]);

    const total = countRows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: { logs: logRows, total, page, limit },
    });
  } catch (error) {
    console.error("[Audit Logs] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
});
