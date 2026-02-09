import type { NextRequest } from "next/server";
import { getConfig } from "@/modules/config/services/config-loader";
import { successResponse, errorResponse } from "@/lib/utils/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const app = searchParams.get("app") || "";

    // Validate app parameter
    const validApps = ["", "hub", "client", "admin"];
    if (!validApps.includes(app)) {
      return errorResponse(
        `Invalid app parameter. Must be one of: ${validApps.filter(Boolean).join(", ")}`,
        422
      );
    }

    const config = await getConfig(app);

    return successResponse(config);
  } catch (error) {
    console.error("[API] Config error:", error);
    return errorResponse("Internal server error", 500);
  }
}
