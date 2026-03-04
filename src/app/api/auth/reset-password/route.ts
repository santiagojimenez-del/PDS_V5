import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/modules/auth/schemas/auth-schemas";
import { resetPassword } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { resetPasswordLimiter, getClientIp } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
  let step = "init";
  try {
    step = "extracting client info";
    const ip = getClientIp(request.headers);
    const userAgent = request.headers.get("user-agent") || "unknown";

    step = "rate limiting";
    if (!resetPasswordLimiter.check(ip)) {
      return errorResponse("Too many password reset attempts. Please try again later.", 429);
    }

    step = "reading body";
    const body = await request.json();

    step = "validating";
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { token, password } = parsed.data;

    step = "calling reset password";
    const result = await resetPassword(token, password, ip, userAgent);

    if (!result.success) {
      return errorResponse(result.error || "Password reset failed", 400);
    }

    return successResponse({
      user: result.user,
    });
  } catch (error: any) {
    console.error("[API] Reset password error at step:", step, error);
    return errorResponse(`Error at [${step}]: ${error?.message || "unknown"}`, 500);
  }
}
