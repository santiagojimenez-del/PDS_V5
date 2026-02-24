import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { markAsRead } from "@/modules/notifications/notification-service";

/**
 * PATCH /api/notifications/[id]/read
 * Marks a single notification as read (must belong to the current user).
 */
export const PATCH = withAuth(async (user, req: NextRequest) => {
  const segments = new URL(req.url).pathname.split("/");
  const id = parseInt(segments[segments.length - 2]);
  if (isNaN(id)) return errorResponse("Invalid notification ID");

  try {
    await markAsRead(id, user.id);
    return successResponse({ message: "Notification marked as read" });
  } catch (error) {
    console.error("[Notifications API] Mark read error:", error);
    return errorResponse("Failed to mark notification as read", 500);
  }
});
