import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, hashPassword } from "@/lib/auth/crypto";
import { getSessionToken, removeUserTokens } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const POST = withAuth(async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch current hashed password from DB
    const userRow = await db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRow.length || !userRow[0].password) {
      return errorResponse("User not found", 404);
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, userRow[0].password);
    if (!valid) {
      return errorResponse("Current password is incorrect", 400);
    }

    // Prevent setting the same password
    const isSame = await verifyPassword(newPassword, userRow[0].password);
    if (isSame) {
      return errorResponse("New password must be different from your current password", 400);
    }

    // Hash and save the new password
    const hashedPassword = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    // Keep current session active — remove all OTHER session tokens
    const currentToken = await getSessionToken();
    if (currentToken) {
      const userFull = await db
        .select({ tokens: users.tokens })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (userFull.length) {
        const raw = userFull[0].tokens;
        const tokenList: Array<{ type: string; token?: string }> =
          Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : [];

        // Keep only the current active session, drop all others
        const filtered = tokenList.filter(
          (t) => t.type !== "session" || t.token === currentToken
        );

        await db
          .update(users)
          .set({ tokens: JSON.stringify(filtered) })
          .where(eq(users.id, user.id));
      }
    }

    return successResponse({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Failed to update password", 500);
  }
});
