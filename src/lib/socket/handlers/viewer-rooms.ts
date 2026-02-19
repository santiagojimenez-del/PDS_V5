/**
 * Viewer room management.
 * Handles: product:join, product:leave, product:users
 * Tracks in-memory who is in each viewer room.
 * On join: updates User_Meta.last_viewer_activity in DB.
 * On disconnect: auto-removes from all rooms.
 */

import type { Server, Socket } from "socket.io";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import type { SocketUser } from "../auth";

interface RoomEntry {
  user: SocketUser;
  joinedAt: number;
}

// jobProductId -> Map<socketId, RoomEntry>
export const viewerRooms = new Map<string, Map<string, RoomEntry>>();

function getRoomUsers(jobProductId: string): SocketUser[] {
  const room = viewerRooms.get(jobProductId);
  if (!room) return [];
  return Array.from(room.values()).map((v) => v.user);
}

function emitRoomUsers(io: Server, jobProductId: string) {
  const users = getRoomUsers(jobProductId);
  io.to(jobProductId).emit("product:users", { users });
}

export function registerViewerRoomHandlers(io: Server, socket: Socket) {
  const user = socket.data.user as SocketUser;

  socket.on("product:join", async (data: { jobProductId: string }) => {
    const { jobProductId } = data;
    if (!jobProductId) return;

    // Join Socket.IO room
    socket.join(jobProductId);

    // Track in-memory
    if (!viewerRooms.has(jobProductId)) {
      viewerRooms.set(jobProductId, new Map());
    }
    viewerRooms.get(jobProductId)!.set(socket.id, {
      user,
      joinedAt: Date.now(),
    });

    // Update last_viewer_activity in User_Meta
    try {
      await db.execute(
        sql`INSERT INTO User_Meta (uid, meta_key, meta_value)
            VALUES (${user.id}, 'last_viewer_activity', ${new Date().toISOString()})
            ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`
      );
    } catch (err) {
      console.error("[Socket] Failed to update last_viewer_activity:", err);
    }

    // Broadcast updated user list to the room
    emitRoomUsers(io, jobProductId);
  });

  socket.on("product:leave", (data: { jobProductId: string }) => {
    const { jobProductId } = data;
    if (!jobProductId) return;

    socket.leave(jobProductId);
    viewerRooms.get(jobProductId)?.delete(socket.id);

    emitRoomUsers(io, jobProductId);
  });

  // On disconnect: remove from every room this socket was in
  socket.on("disconnect", () => {
    for (const [jobProductId, room] of viewerRooms) {
      if (room.has(socket.id)) {
        room.delete(socket.id);
        emitRoomUsers(io, jobProductId);
      }
    }
  });
}
