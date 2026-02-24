import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { markAllAsRead } from "@/modules/notifications/notification-service";

/**
 * POST /api/notifications/read-all
 * Marks all notifications for the current user as read.
 */
export const POST = withAuth(async (user) => {
  try {
    await markAllAsRead(user.id);
    return successResponse({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("[Notifications API] Mark all read error:", error);
    return errorResponse("Failed to mark notifications as read", 500);
  }
});
