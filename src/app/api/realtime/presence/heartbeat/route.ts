/**
 * POST /api/realtime/presence/heartbeat
 *
 * Updates user presence in Redis.
 * Called every 2 seconds by active viewers to maintain "online" status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { kv, PRESENCE_KEYS, PRESENCE_TTL, type PresenceHeartbeatRequest, type PresenceUser } from '@/lib/kv';

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    // Parse request body
    const body = (await request.json()) as PresenceHeartbeatRequest;
    const { jobProductId, cursor } = body;

    if (!jobProductId) {
      return NextResponse.json(
        { success: false, error: 'Missing jobProductId' },
        { status: 400 }
      );
    }

    // Build presence data
    const presenceData: PresenceUser = {
      userId: user.id,
      name: user.fullName,
      email: user.email,
      cursor: cursor || null,
      timestamp: Date.now(),
    };

    // Store in Redis Hash
    const key = PRESENCE_KEYS.users(jobProductId);
    const field = `user:${user.id}`;

    await kv.hset(key, { [field]: JSON.stringify(presenceData) });

    // Set expiration (5 seconds - auto-cleanup stale users)
    await kv.expire(key, PRESENCE_TTL);

    // Get total active user count (for diagnostics)
    const allUsers = await kv.hgetall(key);
    const activeCount = allUsers ? Object.keys(allUsers).length : 0;

    return NextResponse.json({
      success: true,
      activeCount,
    });
  } catch (error) {
    console.error('[Presence Heartbeat] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
