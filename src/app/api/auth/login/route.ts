import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/modules/auth/schemas/auth-schemas";
import { login } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { loginAttemptTracker } from "@/lib/utils/rate-limiter";

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
    const emailKey = email.toLowerCase();

    step = "checking lockout";
    const lockStatus = loginAttemptTracker.isLocked(emailKey);
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil(lockStatus.remainingMs / 60_000);
      return errorResponse(
        `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
        429
      );
    }

    step = "extracting client info";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    step = "calling login";
    const result = await login(email, password, ip, userAgent);

    if (!result.success) {
      // Record the failed attempt and build a helpful message
      const failResult = loginAttemptTracker.recordFailure(emailKey);

      if (failResult.locked) {
        console.warn(`[Security] Account locked after ${failResult.attempts} failed attempts: ${emailKey}`);
        return errorResponse(
          "Too many failed login attempts. Your account has been temporarily locked for 60 minutes.",
          429
        );
      }

      const attemptsLeft = failResult.attemptsLeft;
      const warning =
        attemptsLeft === 1
          ? " Warning: 1 attempt remaining before your account is locked."
          : attemptsLeft > 0
          ? ` ${attemptsLeft} attempts remaining.`
          : "";

      return errorResponse((result.error || "Login failed") + warning, 401);
    }

    // Successful login — clear any recorded failures for this email
    loginAttemptTracker.recordSuccess(emailKey);

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
