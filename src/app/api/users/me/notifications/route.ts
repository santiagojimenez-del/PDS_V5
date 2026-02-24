import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { setMetaValue, getMetaMap } from "@/lib/db/helpers";
import { db } from "@/lib/db";
import { userMeta } from "@/lib/db/schema";
import { z } from "zod";

/**
 * Notification preference keys stored in User_Meta.
 * Default is "true" (opted-in) when the key is not present.
 */
const NOTIFICATION_KEYS = ["notify_email", "notify_job_status"] as const;
type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

/**
 * GET /api/users/me/notifications
 * Returns the current user's notification preferences.
 */
export const GET = withAuth(async (user) => {
  const meta = await getMetaMap(db, userMeta, userMeta.uid, user.id);

  // Default to enabled (true) when the key is not yet set
  const prefs: Record<NotificationKey, boolean> = {
    notify_email:      meta["notify_email"]      !== "false",
    notify_job_status: meta["notify_job_status"] !== "false",
  };

  return successResponse({ preferences: prefs });
});

const patchSchema = z.object({
  key:   z.enum(NOTIFICATION_KEYS),
  value: z.boolean(),
});

/**
 * PATCH /api/users/me/notifications
 * Body: { key: "notify_email" | "notify_job_status", value: boolean }
 */
export const PATCH = withAuth(async (user, req: NextRequest) => {
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const { key, value } = parsed.data;
  await setMetaValue(db, userMeta, userMeta.uid, user.id, key, value ? "true" : "false");

  return successResponse({ [key]: value });
});
