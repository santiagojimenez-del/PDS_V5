/**
 * Vercel KV (Redis) Client
 *
 * Used for ephemeral real-time presence data.
 * Data expires automatically after TTL (5 seconds).
 *
 * Note: Vercel KV has migrated to Upstash Redis integration.
 * The @vercel/kv package is still compatible but may require
 * updating to @upstash/redis in the future.
 */

import { kv } from '@vercel/kv';

export { kv };

/**
 * Redis key patterns for presence data
 */
export const PRESENCE_KEYS = {
  /**
   * Hash key for storing active users in a viewer
   * Format: presence:{jobProductId}:users
   * Fields: user:{userId} → JSON string of user data
   */
  users: (jobProductId: string) => `presence:${jobProductId}:users`,
};

/**
 * Time-to-live for presence data (in seconds)
 * Users are considered "disconnected" if they haven't sent a heartbeat within this time
 */
export const PRESENCE_TTL = 5;

/**
 * Types for presence data
 */
export interface PresenceUser {
  userId: number;
  name: string;
  email: string;
  cursor?: {
    lat: number;
    lng: number;
  } | null;
  timestamp: number;
}

export interface PresenceHeartbeatRequest {
  jobProductId: string;
  cursor?: {
    lat: number;
    lng: number;
  } | null;
}

export interface PresenceHeartbeatResponse {
  success: boolean;
  activeCount: number;
  error?: string;
}

export interface PresenceUsersResponse {
  success: boolean;
  data: {
    users: PresenceUser[];
  };
  error?: string;
}
