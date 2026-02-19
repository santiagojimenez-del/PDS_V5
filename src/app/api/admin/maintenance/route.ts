import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { configuration } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";
import { invalidateConfig } from "@/modules/config/services/config-loader";

/**
 * GET /api/admin/maintenance
 * Returns current maintenance mode status.
 */
export const GET = withRole([ROLES.ADMIN], async () => {
  const rows = await db
    .select({ value: configuration.value })
    .from(configuration)
    .where(
      and(
        eq(configuration.application, "*"),
        eq(configuration.name, "maintenance_mode")
      )
    )
    .limit(1);

  const value = rows[0]?.value;
  const enabled = value === "1" || value === "true";
  return successResponse({ enabled });
});

/**
 * POST /api/admin/maintenance
 * Enable or disable maintenance mode.
 * Body: { enabled: boolean }
 */
export const POST = withRole([ROLES.ADMIN], async (_user, req: NextRequest) => {
  const body = await req.json();
  if (typeof body.enabled !== "boolean") {
    return errorResponse("'enabled' must be a boolean", 400);
  }

  const value = body.enabled ? "1" : "0";

  await db.execute(
    sql`INSERT INTO Configuration (Application, Name, Value)
        VALUES (${"*"}, ${"maintenance_mode"}, ${value})
        ON DUPLICATE KEY UPDATE Value = VALUES(Value)`
  );

  // Invalidate the config cache so the change takes effect quickly
  invalidateConfig();

  return successResponse({
    enabled: body.enabled,
    message: body.enabled
      ? "Maintenance mode enabled. Unauthenticated users will see the maintenance page."
      : "Maintenance mode disabled. The application is accessible to all users.",
  });
});
