import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/modules/auth/schemas/auth-schemas";
import { login } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  let step = "init";
  try {
    step = "reading body";
    const body = await request.json();

    step = "validating";
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { email, password } = parsed.data;

    step = "extracting client info";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    step = "calling login";
    const result = await login(email, password, ip, userAgent);

    if (!result.success) {
      return errorResponse(result.error || "Login failed", 401);
    }

    if (result.requires2FA) {
      return successResponse({
        requires2FA: true,
        verificationToken: result.verificationToken,
      });
    }

    return successResponse({
      user: result.user,
    });
  } catch (error: any) {
    console.error("[API] Login error at step:", step, error);
    return errorResponse(`Error at [${step}]: ${error?.message || "unknown"}`, 500);
  }
}
