/**
 * Component to render other users' cursors on the Leaflet map
 *
 * Creates a colored cursor marker for each active user with their name in a tooltip.
 * Cursors are color-coded by userId for easy identification.
 */

"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { PresenceUser } from "@/lib/kv";
import "./user-cursors.css";

interface UserCursorsProps {
  mapInstance: L.Map | null;
  users: PresenceUser[];
}

// Predefined color palette (including #8600FB from CLAUDE.md)
const CURSOR_COLORS = [
  "#8600FB", // Primary purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Orange
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
];

/**
 * Get a consistent color for a user based on their ID
 */
function getUserColor(userId: number): string {
  return CURSOR_COLORS[userId % CURSOR_COLORS.length];
}

/**
 * Create SVG cursor icon with the specified color
 */
function createCursorIcon(color: string): L.DivIcon {
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 3L19 12L12 13L9 19L5 3Z"
        fill="${color}"
        stroke="white"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  `;

  return L.divIcon({
    html: `<div class="user-cursor-marker">${svg}</div>`,
    className: "user-cursor-icon",
    iconSize: [24, 24],
    iconAnchor: [5, 5], // Point of the cursor
  });
}

export function UserCursors({ mapInstance, users }: UserCursorsProps) {
  // Store markers by userId to update positions efficiently
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapInstance) return;

    const currentMarkers = markersRef.current;

    // Track which users are currently active
    const activeUserIds = new Set(
      users.filter((u) => u.cursor).map((u) => u.userId)
    );

    // Remove markers for users who disconnected or don't have cursors
    currentMarkers.forEach((marker, userId) => {
      if (!activeUserIds.has(userId)) {
        marker.remove();
        currentMarkers.delete(userId);
      }
    });

    // Add or update markers for active users
    users.forEach((user) => {
      if (!user.cursor) return;

      const { lat, lng } = user.cursor;
      const existingMarker = currentMarkers.get(user.userId);

      if (existingMarker) {
        // Update existing marker position
        existingMarker.setLatLng([lat, lng]);
      } else {
        // Create new marker
        const color = getUserColor(user.userId);
        const icon = createCursorIcon(color);

        const marker = L.marker([lat, lng], { icon })
          .bindTooltip(user.name, {
            permanent: false,
            direction: "right",
            offset: [10, -10],
            className: "user-cursor-tooltip",
          })
          .addTo(mapInstance);

        currentMarkers.set(user.userId, marker);
      }
    });

    // Cleanup on unmount
    return () => {
      currentMarkers.forEach((marker) => marker.remove());
      currentMarkers.clear();
    };
  }, [mapInstance, users]);

  return null; // This component doesn't render anything directly
}
