import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { setMetaValue } from "@/lib/db/helpers";
import { db } from "@/lib/db";
import { userMeta } from "@/lib/db/schema";

/**
 * PATCH /api/users/me/2fa
 *
 * Enables or disables email-based 2FA for the current user.
 *
 * Body: { action: "enable" | "disable" }
 */
export const PATCH = withAuth(async (user, req: NextRequest) => {
  const body = await req.json();
  const { action } = body;

  if (action !== "enable" && action !== "disable") {
    return errorResponse("action must be 'enable' or 'disable'", 400);
  }

  const value = action === "enable" ? "true" : "false";
  await setMetaValue(db, userMeta, userMeta.uid, user.id, "two_factor_required", value);

  return successResponse({
    twoFactorEnabled: action === "enable",
    message: action === "enable"
      ? "Two-factor authentication enabled. You will receive an email code at each login."
      : "Two-factor authentication disabled.",
  });
});
