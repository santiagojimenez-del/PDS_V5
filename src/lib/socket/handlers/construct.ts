/**
 * Construct Viewer real-time events.
 *
 * Events:
 *  product:ct_viewer:areas:update   — area polygon updated
 *  product:ct_viewer:areas:delete   — area polygon deleted
 *  product:ct_viewer:classes:update — classification updated
 */

import type { Server, Socket } from "socket.io";
import { setDeliverableValue } from "@/modules/viewers/services/deliverables";

export function registerConstructHandlers(io: Server, socket: Socket) {
  // Areas update
  socket.on(
    "product:ct_viewer:areas:update",
    async (data: { jobProductId: string; areas: unknown }) => {
      const { jobProductId, areas } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "features", JSON.stringify(areas));
      } catch (err) {
        console.error("[Socket/CT] areas:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ct_viewer:areas:update", { areas });
    }
  );

  // Areas delete
  socket.on(
    "product:ct_viewer:areas:delete",
    async (data: { jobProductId: string; areaId: string; areas: unknown }) => {
      const { jobProductId, areaId, areas } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(jobProductId, "features", JSON.stringify(areas));
      } catch (err) {
        console.error("[Socket/CT] areas:delete persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ct_viewer:areas:delete", { areaId, areas });
    }
  );

  // Classifications update
  socket.on(
    "product:ct_viewer:classes:update",
    async (data: { jobProductId: string; classes: unknown }) => {
      const { jobProductId, classes } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(
          jobProductId,
          "classifications",
          JSON.stringify(classes)
        );
      } catch (err) {
        console.error("[Socket/CT] classes:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:ct_viewer:classes:update", { classes });
    }
  );
}
