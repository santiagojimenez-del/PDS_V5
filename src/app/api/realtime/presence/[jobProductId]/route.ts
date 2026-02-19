/**
 * GET /api/realtime/presence/[jobProductId]
 *
 * Fetches active users currently viewing the same map.
 * Called every 2 seconds by viewers to display other users' cursors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { kv, PRESENCE_KEYS, PRESENCE_TTL, type PresenceUser } from '@/lib/kv';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobProductId: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { jobProductId } = await context.params;

    if (!jobProductId) {
      return NextResponse.json(
        { success: false, error: 'Missing jobProductId' },
        { status: 400 }
      );
    }

    // Fetch all users from Redis Hash
    const key = PRESENCE_KEYS.users(jobProductId);
    const allUsersData = await kv.hgetall(key);

    if (!allUsersData) {
      return NextResponse.json({
        success: true,
        data: { users: [] },
      });
    }

    const now = Date.now();
    const maxAge = PRESENCE_TTL * 1000; // Convert to milliseconds

    // Parse and filter users
    const activeUsers: PresenceUser[] = Object.values(allUsersData)
      .map((json) => {
        try {
          return JSON.parse(json as string) as PresenceUser;
        } catch {
          return null;
        }
      })
      .filter((userData): userData is PresenceUser => {
        if (!userData) return false;

        // Filter out current user (don't show own cursor)
        if (userData.userId === user.id) return false;

        // Filter out stale entries (older than TTL)
        if (now - userData.timestamp > maxAge) return false;

        return true;
      });

      return NextResponse.json({
        success: true,
        data: { users: activeUsers },
      });
    } catch (error) {
      console.error('[Presence Fetch] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}
