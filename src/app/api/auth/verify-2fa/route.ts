import type { NextRequest } from "next/server";
import { twoFactorSchema } from "@/modules/auth/schemas/auth-schemas";
import { verify2FA } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the 2FA code
    const parsed = twoFactorSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { code } = parsed.data;

    // The verificationToken is sent alongside the code
    const verificationToken = body.verificationToken;
    if (!verificationToken || typeof verificationToken !== "string") {
      return errorResponse("Verification token is required", 422);
    }

    // Extract client info
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Verify 2FA
    const result = await verify2FA(verificationToken, code, ip, userAgent);

    if (!result.success) {
      return errorResponse(result.error || "Verification failed", 401);
    }

    // Successful verification -- session cookie is set by the auth-service
    return successResponse({
      user: result.user,
    });
  } catch (error) {
    console.error("[API] Verify 2FA error:", error);
    return errorResponse("Internal server error", 500);
  }
}
