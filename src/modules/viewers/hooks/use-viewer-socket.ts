/**
 * React hook for Socket.IO integration in map viewers.
 *
 * - Connects to the socket server
 * - Joins the viewer room for this jobProductId
 * - Tracks who else is in the room (activeUsers)
 * - Provides typed emit helpers for each viewer type
 * - Cleans up (leaves room) on unmount
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket/client";

export interface SocketViewerUser {
  id: number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  roles: number[];
}

interface UseViewerSocketOptions {
  jobProductId: string;
  /** Set false to disable socket (e.g. in shared/public view) */
  enabled?: boolean;
}

interface UseViewerSocketResult {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: SocketViewerUser[];
  // Generic emit
  emit: (event: string, data: Record<string, unknown>) => void;
  // Landscape helpers
  ls: {
    updateAreas: (areas: unknown) => void;
    deleteArea: (areaId: string, areas: unknown) => void;
    updateClasses: (classes: unknown) => void;
    updateViews: (views: unknown) => void;
    deleteView: (viewId: string, views: unknown) => void;
    updateLayers: (showTileset: boolean) => void;
    refresh: () => void;
  };
  // Community helpers
  cm: {
    updateCompliances: (compliances: unknown) => void;
    updateClasses: (classes: unknown) => void;
    updatePropertyDetails: (propertyDetails: unknown) => void;
  };
  // Construct helpers
  ct: {
    updateAreas: (areas: unknown) => void;
    deleteArea: (areaId: string, areas: unknown) => void;
    updateClasses: (classes: unknown) => void;
  };
}

export function useViewerSocket({
  jobProductId,
  enabled = true,
}: UseViewerSocketOptions): UseViewerSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<SocketViewerUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !jobProductId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      if (!joinedRef.current) {
        socket.emit("product:join", { jobProductId });
        joinedRef.current = true;
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setActiveUsers([]);
      joinedRef.current = false;
    };

    const handleProductUsers = (data: { users: SocketViewerUser[] }) => {
      setActiveUsers(data.users);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("product:users", handleProductUsers);

    // If already connected, join now
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("product:users", handleProductUsers);

      if (joinedRef.current) {
        socket.emit("product:leave", { jobProductId });
        joinedRef.current = false;
      }
    };
  }, [jobProductId, enabled]);

  const emit = useCallback(
    (event: string, data: Record<string, unknown>) => {
      socketRef.current?.emit(event, { jobProductId, ...data });
    },
    [jobProductId]
  );

  // ── Landscape helpers ──────────────────────────────────────────────────────
  const ls = {
    updateAreas: useCallback(
      (areas: unknown) => emit("product:ls_viewer:areas:update", { areas }),
      [emit]
    ),
    deleteArea: useCallback(
      (areaId: string, areas: unknown) =>
        emit("product:ls_viewer:areas:delete", { areaId, areas }),
      [emit]
    ),
    updateClasses: useCallback(
      (classes: unknown) => emit("product:ls_viewer:classes:update", { classes }),
      [emit]
    ),
    updateViews: useCallback(
      (views: unknown) => emit("product:ls_viewer:views:update", { views }),
      [emit]
    ),
    deleteView: useCallback(
      (viewId: string, views: unknown) =>
        emit("product:ls_viewer:views:delete", { viewId, views }),
      [emit]
    ),
    updateLayers: useCallback(
      (showTileset: boolean) =>
        emit("product:ls_viewer:layers:update", { showTileset }),
      [emit]
    ),
    refresh: useCallback(
      () => emit("product:ls_viewer:refresh", {}),
      [emit]
    ),
  };

  // ── Community helpers ──────────────────────────────────────────────────────
  const cm = {
    updateCompliances: useCallback(
      (compliances: unknown) =>
        emit("product:cm_viewer:compliances:update", { compliances }),
      [emit]
    ),
    updateClasses: useCallback(
      (classes: unknown) => emit("product:cm_viewer:classes:update", { classes }),
      [emit]
    ),
    updatePropertyDetails: useCallback(
      (propertyDetails: unknown) =>
        emit("product:cm_viewer:property_details:update", { propertyDetails }),
      [emit]
    ),
  };

  // ── Construct helpers ──────────────────────────────────────────────────────
  const ct = {
    updateAreas: useCallback(
      (areas: unknown) => emit("product:ct_viewer:areas:update", { areas }),
      [emit]
    ),
    deleteArea: useCallback(
      (areaId: string, areas: unknown) =>
        emit("product:ct_viewer:areas:delete", { areaId, areas }),
      [emit]
    ),
    updateClasses: useCallback(
      (classes: unknown) => emit("product:ct_viewer:classes:update", { classes }),
      [emit]
    ),
  };

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    emit,
    ls,
    cm,
    ct,
  };
}
