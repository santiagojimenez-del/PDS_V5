/**
 * Landscape Viewer real-time events.
 *
 * Each event:
 *  1. Persists the change to Job_Deliverable in DB
 *  2. Broadcasts to all other clients in the same viewer room
 *
 * Events:
 *  product:ls_viewer:areas:update   — area polygon created/updated
 *  product:ls_viewer:areas:delete   — area polygon deleted
 *  product:ls_viewer:classes:update — classification updated
 *  product:ls_viewer:views:update   — saved view added
 *  product:ls_viewer:views:delete   — saved view deleted
 *  product:ls_viewer:layers:update  — layer toggle changed
 *  product:ls_viewer:refresh        — force all clients to reload data
 */

import type { Server, Socket } from "socket.io";
import { setDeliverableValue } from "@/modules/viewers/services/deliverables";

export function registerLandscapeHandlers(io: Server, socket: Socket) {
  // Areas update
  socket.on(
    "product:ls_viewer:areas:update",
    async (data: { jobProductId: string; areas: unknown }) => {
      const { jobProductId, areas } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "features", JSON.stringify(areas));
      } catch (err) {
        console.error("[Socket/LS] areas:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ls_viewer:areas:update", { areas });
    }
  );

  // Areas delete (single area by ID)
  socket.on(
    "product:ls_viewer:areas:delete",
    async (data: { jobProductId: string; areaId: string; areas: unknown }) => {
      const { jobProductId, areaId, areas } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "features", JSON.stringify(areas));
      } catch (err) {
        console.error("[Socket/LS] areas:delete persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ls_viewer:areas:delete", { areaId, areas });
    }
  );

  // Classifications update
  socket.on(
    "product:ls_viewer:classes:update",
    async (data: { jobProductId: string; classes: unknown }) => {
      const { jobProductId, classes } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "classifications", JSON.stringify(classes));
      } catch (err) {
        console.error("[Socket/LS] classes:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ls_viewer:classes:update", { classes });
    }
  );

  // Saved views update (add)
  socket.on(
    "product:ls_viewer:views:update",
    async (data: { jobProductId: string; views: unknown }) => {
      const { jobProductId, views } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "saved_views", JSON.stringify(views));
      } catch (err) {
        console.error("[Socket/LS] views:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ls_viewer:views:update", { views });
    }
  );

  // Saved views delete
  socket.on(
    "product:ls_viewer:views:delete",
    async (data: { jobProductId: string; viewId: string; views: unknown }) => {
      const { jobProductId, viewId, views } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "saved_views", JSON.stringify(views));
      } catch (err) {
        console.error("[Socket/LS] views:delete persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ls_viewer:views:delete", { viewId, views });
    }
  );

  // Layer toggles
  socket.on(
    "product:ls_viewer:layers:update",
    async (data: { jobProductId: string; showTileset: boolean }) => {
      const { jobProductId, showTileset } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(
          jobProductId,
          "show_tileset",
          JSON.stringify(showTileset)
        );
      } catch (err) {
        console.error("[Socket/LS] layers:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ls_viewer:layers:update", { showTileset });
    }
  );

  // Force all clients in room to refresh
  socket.on(
    "product:ls_viewer:refresh",
    (data: { jobProductId: string }) => {
      const { jobProductId } = data;
      if (!jobProductId) return;

      socket.to(jobProductId).emit("product:ls_viewer:refresh");
    }
  );
}
