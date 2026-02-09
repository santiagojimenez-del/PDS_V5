import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse("Not authenticated");
    }

    return successResponse({ user });
  } catch (error) {
    console.error("[API] Auth metadata error:", error);
    return unauthorizedResponse("Not authenticated");
  }
}
