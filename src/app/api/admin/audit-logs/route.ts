/**
 * GET /api/admin/audit-logs
 *
 * Fetch audit logs with pagination and filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { desc, like, or, eq } from "drizzle-orm";

export const GET = withAuth(async (user, request: NextRequest) => {
  // Only admins can access audit logs
  if (user.role !== "Admin" && user.role !== "Super Admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "25");
    const action = searchParams.get("action");
    const search = searchParams.get("search");

    // Build query
    let query = db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt));

    // Apply filters
    const conditions = [];

    if (action && action !== "all") {
      conditions.push(like(auditLogs.action, `%${action}%`));
    }

    if (search) {
      conditions.push(
        or(
          like(auditLogs.action, `%${search}%`),
          like(auditLogs.resource, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      // Note: Drizzle ORM syntax - need to properly combine conditions
      // This is a simplified version
      query = query.where(conditions[0]) as typeof query;
    }

    // Get total count
    const countQuery = db
      .select({ count: auditLogs.id })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id));

    const [logs, countResult] = await Promise.all([
      query.limit(limit).offset(page * limit),
      countQuery,
    ]);

    const total = countResult.length;

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[Audit Logs] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
});
