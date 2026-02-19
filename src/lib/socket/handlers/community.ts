/**
 * Community Viewer real-time events.
 *
 * Events:
 *  product:cm_viewer:compliances:update    — compliance report updated
 *  product:cm_viewer:classes:update        — classification updated
 *  product:cm_viewer:property_details:update — property detail updated
 */

import type { Server, Socket } from "socket.io";
import { setDeliverableValue } from "@/modules/viewers/services/deliverables";

export function registerCommunityHandlers(io: Server, socket: Socket) {
  // Compliances update
  socket.on(
    "product:cm_viewer:compliances:update",
    async (data: { jobProductId: string; compliances: unknown }) => {
      const { jobProductId, compliances } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(
          jobProductId,
          "compliances",
          JSON.stringify(compliances)
        );
      } catch (err) {
        console.error("[Socket/CM] compliances:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:cm_viewer:compliances:update", { compliances });
    }
  );

  // Classifications update
  socket.on(
    "product:cm_viewer:classes:update",
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
        console.error("[Socket/CM] classes:update persist failed:", err);
      }

      socket.to(jobProductId).emit("product:cm_viewer:classes:update", { classes });
    }
  );

  // Property details update
  socket.on(
    "product:cm_viewer:property_details:update",
    async (data: { jobProductId: string; propertyDetails: unknown }) => {
      const { jobProductId, propertyDetails } = data;
      if (!jobProductId) return;

      try {
        await setDeliverableValue(
          jobProductId,
          "property_details",
          JSON.stringify(propertyDetails)
        );
      } catch (err) {
        console.error("[Socket/CM] property_details:update persist failed:", err);
      }

      socket
        .to(jobProductId)
        .emit("product:cm_viewer:property_details:update", { propertyDetails });
    }
  );
}
