/**
 * Hook to manage real-time presence in a viewer
 *
 * Sends heartbeat every 2s to maintain "online" status and polls every 2s
 * to fetch other active users. Returns list of users with cursor positions.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import type { PresenceUser } from "@/lib/kv";
import { usePresenceConfig } from "./use-presence-config";

interface UseViewerPresenceOptions {
  enabled?: boolean;
  heartbeatInterval?: number;
  pollInterval?: number;
}

interface UseViewerPresenceResult {
  activeUsers: PresenceUser[];
  isConnected: boolean;
  error: Error | null;
}

export function useViewerPresence(
  jobProductId: string,
  cursor: { lat: number; lng: number } | null,
  options: UseViewerPresenceOptions = {}
): UseViewerPresenceResult {
  // Get configuration from centralized config hook
  const config = usePresenceConfig(options);
  const { enabled, heartbeatInterval, pollInterval } = config;

  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track last cursor position to avoid unnecessary updates
  const lastCursorRef = useRef<{ lat: number; lng: number } | null>(null);

  // Check if feature is enabled and jobProductId is valid
  const featureEnabled = enabled && !!jobProductId;

  useEffect(() => {
    if (!featureEnabled) {
      setActiveUsers([]);
      setIsConnected(false);
      return;
    }

    let heartbeatIntervalId: NodeJS.Timeout;
    let pollIntervalId: NodeJS.Timeout;

    // Send heartbeat to update presence
    const sendHeartbeat = async () => {
      try {
        // Only send if cursor changed (or first heartbeat)
        const cursorChanged =
          !lastCursorRef.current ||
          cursor?.lat !== lastCursorRef.current.lat ||
          cursor?.lng !== lastCursorRef.current.lng;

        if (!cursorChanged && lastCursorRef.current !== null) {
          return; // Skip if cursor hasn't moved
        }

        lastCursorRef.current = cursor;

        const response = await fetch("/api/realtime/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobProductId, cursor }),
        });

        if (!response.ok) {
          throw new Error(`Heartbeat failed: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        console.error("[Presence] Heartbeat error:", err);
        setIsConnected(false);
        setError(err instanceof Error ? err : new Error("Heartbeat failed"));
      }
    };

    // Poll for active users
    const pollActiveUsers = async () => {
      try {
        const response = await fetch(
          `/api/realtime/presence/${encodeURIComponent(jobProductId)}`
        );

        if (!response.ok) {
          throw new Error(`Poll failed: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data?.users) {
          setActiveUsers(data.data.users);
          setError(null);
        }
      } catch (err) {
        console.error("[Presence] Poll error:", err);
        setError(err instanceof Error ? err : new Error("Poll failed"));
      }
    };

    // Initial calls
    sendHeartbeat();
    pollActiveUsers();

    // Setup intervals
    heartbeatIntervalId = setInterval(sendHeartbeat, heartbeatInterval);
    pollIntervalId = setInterval(pollActiveUsers, pollInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatIntervalId);
      clearInterval(pollIntervalId);
      setIsConnected(false);
    };
  }, [featureEnabled, jobProductId, cursor, heartbeatInterval, pollInterval]);

  return {
    activeUsers,
    isConnected,
    error,
  };
}
