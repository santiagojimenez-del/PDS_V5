/**
 * Client-side Socket.IO singleton.
 * Connects to the same origin as the page (same server).
 * Credentials (cookie) are sent automatically.
 *
 * Usage:
 *   import { getSocket, disconnectSocket } from "@/lib/socket/client";
 *   const socket = getSocket();
 *   socket.emit("product:join", { jobProductId });
 */

import { io, type Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    _socket.on("connect", () => {
      console.log("[Socket] Connected:", _socket?.id);
    });

    _socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    _socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    _socket.on("session_expired", () => {
      console.warn("[Socket] Session expired — redirecting to login");
      window.location.href = "/auth/login";
    });
  }

  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
