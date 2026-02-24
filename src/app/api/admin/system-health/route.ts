/**
 * GET /api/admin/system-health
 *
 * System health check endpoint - checks database, API, and email services
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import packageJson from "../../../../../package.json";

interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

export const GET = withAuth(async (user, request: NextRequest) => {
  // Only admins can access system health
  if (!user.roles.includes(0)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  const checks: HealthCheck[] = [];
  let overallStatus: "healthy" | "degraded" | "down" = "healthy";

  // Check Database
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbTime = Date.now() - dbStart;

    checks.push({
      service: "Database",
      status: dbTime < 100 ? "healthy" : dbTime < 500 ? "degraded" : "down",
      responseTime: dbTime,
      message: dbTime < 100 ? "Connection stable" : "Slow response time",
      lastCheck: new Date().toISOString(),
    });

    if (dbTime >= 500) {
      overallStatus = "degraded";
    }
  } catch (error) {
    checks.push({
      service: "Database",
      status: "down",
      message: error instanceof Error ? error.message : "Connection failed",
      lastCheck: new Date().toISOString(),
    });
    overallStatus = "down";
  }

  // Check API (self-check)
  try {
    const apiStart = Date.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`, {
      method: "GET",
    });
    const apiTime = Date.now() - apiStart;

    checks.push({
      service: "API",
      status: response.ok ? "healthy" : "down",
      responseTime: apiTime,
      message: response.ok ? "All endpoints operational" : "Health check failed",
      lastCheck: new Date().toISOString(),
    });

    if (!response.ok && overallStatus !== "down") {
      overallStatus = "degraded";
    }
  } catch (error) {
    checks.push({
      service: "API",
      status: "down",
      message: "API health check failed",
      lastCheck: new Date().toISOString(),
    });
    overallStatus = "down";
  }

  // Check Email Service
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || "console";
    const hasConfig = emailProvider !== "console";

    checks.push({
      service: "Email",
      status: hasConfig ? "healthy" : "degraded",
      message: hasConfig
        ? `Provider: ${emailProvider}`
        : "Using console provider (dev mode)",
      lastCheck: new Date().toISOString(),
    });

    if (!hasConfig && overallStatus === "healthy") {
      overallStatus = "degraded";
    }
  } catch (error) {
    checks.push({
      service: "Email",
      status: "down",
      message: "Email service check failed",
      lastCheck: new Date().toISOString(),
    });
    if (overallStatus !== "down") {
      overallStatus = "degraded";
    }
  }

  // Calculate uptime
  const uptime = process.uptime ? Math.floor(process.uptime()) : 0;

  // Runtime / version info — read server-side so the client never needs process.version
  const sysInfo = {
    nodeVersion:  process.version,
    nextVersion:  packageJson.dependencies?.next ?? "unknown",
    appVersion:   packageJson.version ?? "0.0.0",
    environment:  process.env.NODE_ENV ?? "development",
  };

  return NextResponse.json({
    success: true,
    data: {
      overall: overallStatus,
      checks,
      uptime,
      timestamp: new Date().toISOString(),
      sysInfo,
    },
  });
});
