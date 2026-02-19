/**
 * Admin Socket.IO events.
 *
 * Events:
 *  admin:developer:connections        — client requests current active connections
 *  admin:developer:connections:update — server broadcasts active connection list
 *
 * Permission: requires role 0 (Admin) or permission developer_tools.
 */

import type { Server, Socket } from "socket.io";
import type { SocketUser } from "../auth";
import { ROLES } from "@/lib/constants";

interface ConnectionInfo {
  socketId: string;
  userId: number;
  email: string;
  fullName: string;
  roles: number[];
  connectedAt: number;
  rooms: string[]; // viewer rooms currently joined
}

function buildConnectionList(io: Server): ConnectionInfo[] {
  const connections: ConnectionInfo[] = [];

  for (const [socketId, socket] of io.sockets.sockets) {
    const user = socket.data?.user as SocketUser | undefined;
    if (!user) continue;

    // Get all rooms except the socket's own default room (its socketId)
    const rooms = Array.from(socket.rooms).filter((r) => r !== socketId);

    connections.push({
      socketId,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      connectedAt: socket.handshake.issued,
      rooms,
    });
  }

  return connections;
}

export function registerAdminHandlers(io: Server, socket: Socket) {
  const user = socket.data.user as SocketUser;

  // Only allow admin users or those with developer_tools permission
  const isAdmin = user.roles.includes(ROLES.ADMIN);
  if (!isAdmin) return; // Non-admins get no admin events registered

  // Client requests the current active connections list
  socket.on("admin:developer:connections", () => {
    const connections = buildConnectionList(io);
    socket.emit("admin:developer:connections:update", { connections });
  });
}

/**
 * Broadcast active connections update to all admin sockets.
 * Called externally when a socket connects/disconnects.
 */
export function broadcastConnectionsToAdmins(io: Server) {
  const connections = buildConnectionList(io);

  for (const [, s] of io.sockets.sockets) {
    const u = s.data?.user as SocketUser | undefined;
    if (u?.roles.includes(ROLES.ADMIN)) {
      s.emit("admin:developer:connections:update", { connections });
    }
  }
}
