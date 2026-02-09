import type { NextRequest } from "next/server";
import { getCurrentUser, getSessionToken } from "@/lib/auth/session";
import { logout } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/utils/api";

export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse("Not authenticated");
    }

    const token = await getSessionToken();
    if (!token) {
      return unauthorizedResponse("No active session");
    }

    await logout(user.id, token);

    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[API] Logout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
