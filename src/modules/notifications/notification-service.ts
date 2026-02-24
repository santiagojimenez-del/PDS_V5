import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type NotificationType =
  | "job_created"
  | "job_approved"
  | "job_scheduled"
  | "job_flight_logged"
  | "job_delivered"
  | "job_billed"
  | "job_completed"
  | "invoice_created"
  | "general";

export interface CreateNotificationData {
  userId: number;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}

/**
 * Create a single notification for a user.
 * Fire-and-forget safe — does not throw.
 */
export async function createNotification(data: CreateNotificationData): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      link: data.link ?? null,
      isRead: 0,
    });
  } catch (error) {
    console.error("[Notifications] Failed to create notification:", error);
  }
}

/**
 * Create notifications for multiple users at once.
 */
export async function createNotifications(
  userIds: number[],
  data: Omit<CreateNotificationData, "userId">
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await db.insert(notifications).values(
      userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message ?? null,
        link: data.link ?? null,
        isRead: 0,
      }))
    );
  } catch (error) {
    console.error("[Notifications] Failed to create bulk notifications:", error);
  }
}

/**
 * Get paginated notifications for a user.
 */
export async function getNotificationsForUser(
  userId: number,
  limit = 20,
  offset = 0
) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

/**
 * Get unread count for a user.
 */
export async function getUnreadCount(userId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  return result[0]?.count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: number, userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
}
