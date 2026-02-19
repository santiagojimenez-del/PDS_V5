import { NextResponse } from "next/server";
import { getConfigValue } from "@/modules/config/services/config-loader";

/**
 * GET /api/maintenance-status
 *
 * Internal endpoint called by middleware to check maintenance mode.
 * Returns { maintenance: boolean }.
 * Always accessible regardless of maintenance state (excluded from middleware check).
 */
export async function GET() {
  try {
    const val = await getConfigValue("", "maintenance_mode");
    const maintenance = val === "1" || val === "true" || val === true;
    return NextResponse.json({ maintenance });
  } catch {
    // If DB is down, don't lock everyone out
    return NextResponse.json({ maintenance: false });
  }
}
