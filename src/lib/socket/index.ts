/**
 * Socket.IO server — initialization and singleton.
 *
 * Call initSocketServer(io) once from server.ts.
 * Call getIO() anywhere on the server to emit events.
 *
 * Cron jobs:
 *  Every 60s  — re-validate connected sessions; disconnect expired ones
 *  Every 5min — no-op (Socket.IO auto-cleans disconnected sockets)
 */

import type { Server } from "socket.io";
import { authenticateSocket } from "./auth";
import { registerViewerRoomHandlers } from "./handlers/viewer-rooms";
import { registerLandscapeHandlers } from "./handlers/landscape";
import { registerCommunityHandlers } from "./handlers/community";
import { registerConstructHandlers } from "./handlers/construct";
import { registerAdminHandlers, broadcastConnectionsToAdmins } from "./handlers/admin";

// Module-level singleton
let _io: Server | null = null;

export function getIO(): Server {
  if (!_io) throw new Error("Socket.IO server not initialized — call initSocketServer() first");
  return _io;
}

export function initSocketServer(io: Server): void {
  _io = io;

  // ── Auth middleware ──────────────────────────────────────────────────────────
  // Runs on every new connection. Rejects if session is invalid.
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const user = await authenticateSocket(cookieHeader);

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = user;
    // Store cookie header so we can re-validate in the cron
    socket.data.cookieHeader = cookieHeader;
    next();
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`[Socket] + ${user.fullName || user.email} (${socket.id})`);

    registerViewerRoomHandlers(io, socket);
    registerLandscapeHandlers(io, socket);
    registerCommunityHandlers(io, socket);
    registerConstructHandlers(io, socket);
    registerAdminHandlers(io, socket);

    // Notify admins that connections changed
    broadcastConnectionsToAdmins(io);

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] - ${user.fullName || user.email} (${socket.id}) [${reason}]`);
      // Notify admins that connections changed (after a tick so Socket.IO cleans up)
      setImmediate(() => broadcastConnectionsToAdmins(io));
    });
  });

  // ── Cron: session validation every 60s ──────────────────────────────────────
  setInterval(async () => {
    try {
      const sockets = await io.fetchSockets();
      for (const socket of sockets) {
        const cookieHeader = socket.data?.cookieHeader as string | undefined;
        const user = await authenticateSocket(cookieHeader);
        if (!user) {
          socket.emit("session_expired");
          socket.disconnect(true);
        }
      }
    } catch (err) {
      console.error("[Socket Cron] Session validation error:", err);
    }
  }, 60 * 1000);

  console.log("[Socket] Server initialized");
}
