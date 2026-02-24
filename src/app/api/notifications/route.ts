import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import {
  getNotificationsForUser,
  getUnreadCount,
} from "@/modules/notifications/notification-service";

/**
 * GET /api/notifications
 * Returns the current user's notifications + unread count.
 * Query params: limit (default 20), offset (default 0)
 */
export const GET = withAuth(async (user, req) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const [items, unreadCount] = await Promise.all([
      getNotificationsForUser(user.id, limit, offset),
      getUnreadCount(user.id),
    ]);

    return successResponse({ notifications: items, unreadCount });
  } catch (error) {
    console.error("[Notifications API] Error:", error);
    return errorResponse("Failed to fetch notifications", 500);
  }
});
