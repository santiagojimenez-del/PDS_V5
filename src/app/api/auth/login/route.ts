import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/modules/auth/schemas/auth-schemas";
import { login } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { email, password } = parsed.data;

    // Extract client info
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Attempt login
    const result = await login(email, password, ip, userAgent);

    if (!result.success) {
      return errorResponse(result.error || "Login failed", 401);
    }

    // Handle 2FA response
    if (result.requires2FA) {
      return successResponse({
        requires2FA: true,
        verificationToken: result.verificationToken,
      });
    }

    // Successful login -- session cookie is set by the auth-service
    return successResponse({
      user: result.user,
    });
  } catch (error) {
    console.error("[API] Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
