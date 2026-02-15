import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/modules/auth/schemas/auth-schemas";
import { forgotPassword } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { forgotPasswordLimiter } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
  let step = "init";
  try {
    step = "reading body";
    const body = await request.json();

    step = "validating";
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { email } = parsed.data;

    step = "rate limiting";
    if (!forgotPasswordLimiter.check(email)) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    step = "calling forgot password";
    await forgotPassword(email);

    // Always return success message (prevent email enumeration)
    return successResponse({
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error: any) {
    console.error("[API] Forgot password error at step:", step, error);
    // Still return success to prevent information leakage
    return successResponse({
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  }
}
