/**
 * Hook to track cursor position on a Leaflet map
 *
 * Converts mouse movements to lat/lng coordinates and throttles updates
 * to reduce network traffic (max 10 updates/second).
 */

"use client";

import { useEffect, useState, useRef } from "react";
import type L from "leaflet";
import { usePresenceConfig } from "./use-presence-config";

interface CursorPosition {
  lat: number;
  lng: number;
}

interface UseCursorTrackingOptions {
  throttleMs?: number;
  enabled?: boolean;
}

export function useCursorTracking(
  mapInstance: L.Map | null,
  options: UseCursorTrackingOptions = {}
): { cursor: CursorPosition | null } {
  // Get throttle config from centralized config (can be overridden)
  const config = usePresenceConfig();
  const throttleMs = options.throttleMs ?? config.cursorThrottle;
  const enabled = options.enabled ?? config.enabled;
  const [cursor, setCursor] = useState<CursorPosition | null>(null);
  const lastUpdateTime = useRef<number>(0);

  useEffect(() => {
    if (!mapInstance || !enabled) {
      setCursor(null);
      return;
    }

    // Handler for mouse movement
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const now = Date.now();

      // Throttle: only update if enough time has passed
      if (now - lastUpdateTime.current < throttleMs) {
        return;
      }

      lastUpdateTime.current = now;

      // Convert to lat/lng
      const { lat, lng } = e.latlng;
      setCursor({ lat, lng });
    };

    // Handler for mouse leaving the map
    const handleMouseOut = () => {
      setCursor(null);
    };

    // Attach event listeners
    mapInstance.on("mousemove", handleMouseMove);
    mapInstance.on("mouseout", handleMouseOut);

    // Cleanup
    return () => {
      mapInstance.off("mousemove", handleMouseMove);
      mapInstance.off("mouseout", handleMouseOut);
    };
  }, [mapInstance, throttleMs, enabled]);

  return { cursor };
}
