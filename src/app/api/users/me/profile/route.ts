import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { setMetaValue, getMetaMap } from "@/lib/db/helpers";
import { db } from "@/lib/db";
import { userMeta } from "@/lib/db/schema";
import { getSessionToken } from "@/lib/auth/session";
import { cache } from "@/lib/cache";
import { z } from "zod";

/**
 * GET /api/users/me/profile
 * Returns editable profile fields for the current user.
 */
export const GET = withAuth(async (user) => {
  const meta = await getMetaMap(db, userMeta, userMeta.uid, user.id);

  return successResponse({
    firstName:   meta["first_name"]   ?? "",
    lastName:    meta["last_name"]    ?? "",
    phoneNumber: meta["phone_number"] ?? "",
  });
});

const patchSchema = z.object({
  firstName:   z.string().max(100).optional(),
  lastName:    z.string().max(100).optional(),
  phoneNumber: z.string().max(30).optional(),
});

/**
 * PATCH /api/users/me/profile
 * Updates first name, last name, and/or phone number.
 */
export const PATCH = withAuth(async (user, req: NextRequest) => {
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const { firstName, lastName, phoneNumber } = parsed.data;

  if (firstName !== undefined) {
    await setMetaValue(db, userMeta, userMeta.uid, user.id, "first_name", firstName.trim());
  }
  if (lastName !== undefined) {
    await setMetaValue(db, userMeta, userMeta.uid, user.id, "last_name", lastName.trim());
  }
  if (phoneNumber !== undefined) {
    await setMetaValue(db, userMeta, userMeta.uid, user.id, "phone_number", phoneNumber.trim());
  }

  // Bust the in-memory session cache so the next request re-reads from DB
  const sessionToken = await getSessionToken();
  if (sessionToken) {
    cache.delete(`session:${sessionToken.substring(0, 20)}`);
  }

  return successResponse({ updated: true });
});
