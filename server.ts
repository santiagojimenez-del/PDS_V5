/**
 * Custom Next.js server with Socket.IO integration.
 * Run with: tsx server.ts (dev) or NODE_ENV=production tsx server.ts (prod)
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { initSocketServer } from "./src/lib/socket/index";
import { processDeliveryEmailQueue } from "./src/modules/email/services/delivery-email-worker";

const port = parseInt(process.env.PORT || "3005", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const CORS_ORIGINS = dev
  ? [
      "http://localhost:3005",
      "http://localhost:3003",
      "http://127.0.0.1:3005",
    ]
  : [
      "https://hub.prodrones.com",
      "https://client.prodrones.com",
      "https://admin.prodrones.com",
    ];

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  const io = new SocketServer(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  initSocketServer(io);

  // ── Cron: delivery email queue — every 60s ─────────────────────────────────
  // Persistent worker (survives restarts because it lives in this process).
  // Per initial prompt: "Email worker must be persistent — don't use in-memory queues".
  const runDeliveryWorker = async () => {
    try {
      const result = await processDeliveryEmailQueue();
      if (result.processed > 0) {
        console.log(
          `[CRON/DeliveryEmail] processed=${result.processed} sent=${result.sent} failed=${result.failed} skipped=${result.skipped}`
        );
      }
      if (result.errors.length > 0) {
        console.error("[CRON/DeliveryEmail] Errors:", result.errors);
      }
    } catch (err) {
      console.error("[CRON/DeliveryEmail] Unexpected error:", err);
    }
  };

  // Run once at startup to catch any emails queued while server was down
  runDeliveryWorker();
  setInterval(runDeliveryWorker, 60 * 1000);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO initialized`);
    console.log(`> Delivery email worker running (60s interval)`);
  });
});
