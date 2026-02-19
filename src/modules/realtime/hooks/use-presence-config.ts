/**
 * Hook to manage presence feature configuration
 *
 * Centralizes all configuration settings for the real-time presence system.
 * Allows easy feature toggling and configuration management.
 */

"use client";

import { useMemo } from "react";

interface PresenceConfig {
  enabled: boolean;
  heartbeatInterval: number;
  pollInterval: number;
  cursorThrottle: number;
  ttl: number;
}

interface UsePresenceConfigOptions {
  enabled?: boolean;
  heartbeatInterval?: number;
  pollInterval?: number;
  cursorThrottle?: number;
}

/**
 * Get presence system configuration
 *
 * Reads from environment variables and allows runtime overrides.
 */
export function usePresenceConfig(
  options: UsePresenceConfigOptions = {}
): PresenceConfig {
  const config = useMemo(() => {
    // Check if feature is globally enabled via environment variable
    const globallyEnabled =
      process.env.NEXT_PUBLIC_PRESENCE_ENABLED !== "false";

    return {
      // Feature toggle
      enabled: globallyEnabled && (options.enabled !== false),

      // Heartbeat interval (how often to send presence updates)
      // Default: 2000ms (2 seconds)
      // Higher values reduce server load but increase latency
      heartbeatInterval: options.heartbeatInterval ?? 2000,

      // Poll interval (how often to fetch other users)
      // Default: 2000ms (2 seconds)
      // Higher values reduce server load but increase latency
      pollInterval: options.pollInterval ?? 2000,

      // Cursor position throttle (max cursor updates per second)
      // Default: 100ms (10 updates/second)
      // Lower values increase responsiveness but network usage
      cursorThrottle: options.cursorThrottle ?? 100,

      // TTL for presence data in Redis (seconds)
      // Default: 5 seconds
      // Note: This is defined in backend, but exposed here for reference
      ttl: 5,
    };
  }, [
    options.enabled,
    options.heartbeatInterval,
    options.pollInterval,
    options.cursorThrottle,
  ]);

  return config;
}

/**
 * Check if presence feature is available
 *
 * Useful for conditional rendering or feature detection.
 */
export function usePresenceAvailable(): boolean {
  const { enabled } = usePresenceConfig();
  return enabled;
}

/**
 * Get optimized config for different scenarios
 */
export function usePresenceConfigPreset(
  preset: "default" | "low-latency" | "low-bandwidth" | "high-capacity"
): PresenceConfig {
  const presets = {
    // Default: Balanced performance (2s intervals)
    default: {
      heartbeatInterval: 2000,
      pollInterval: 2000,
      cursorThrottle: 100,
    },

    // Low latency: Faster updates, higher server load (1s intervals)
    "low-latency": {
      heartbeatInterval: 1000,
      pollInterval: 1000,
      cursorThrottle: 50,
    },

    // Low bandwidth: Slower updates, lower server load (5s intervals)
    "low-bandwidth": {
      heartbeatInterval: 5000,
      pollInterval: 5000,
      cursorThrottle: 200,
    },

    // High capacity: Support more concurrent users (5s intervals)
    "high-capacity": {
      heartbeatInterval: 5000,
      pollInterval: 5000,
      cursorThrottle: 200,
    },
  };

  return usePresenceConfig(presets[preset]);
}
