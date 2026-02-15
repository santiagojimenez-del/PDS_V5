import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/modules/auth/schemas/auth-schemas";
import { resetPassword } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  let step = "init";
  try {
    step = "reading body";
    const body = await request.json();

    step = "validating";
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { token, password } = parsed.data;

    step = "extracting client info";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

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
