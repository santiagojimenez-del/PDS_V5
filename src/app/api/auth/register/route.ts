import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { registerSchema } from "@/modules/auth/schemas/auth-schemas";
import { register } from "@/modules/auth/services/auth-service";
import { successResponse, errorResponse } from "@/lib/utils/api";

export async function POST(request: NextRequest) {
  let step = "init";
  try {
    step = "reading body";
    const body = await request.json();

    step = "validating";
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return errorResponse(firstError, 422);
    }

    const { email, password, firstName, lastName } = parsed.data;

    step = "extracting client info";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    step = "calling register";
    const result = await register(email, password, firstName, lastName, ip, userAgent);

    if (!result.success) {
      return errorResponse(result.error || "Registration failed", 400);
    }

    return successResponse({
      user: result.user,
    });
  } catch (error: any) {
    console.error("[API] Register error at step:", step, error);
    return errorResponse(`Error at [${step}]: ${error?.message || "unknown"}`, 500);
  }
}
