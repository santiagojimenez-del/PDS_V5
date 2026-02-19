/**
 * Batched Delivery Email Worker
 *
 * Processes the Delivery_Email_Outbox queue.
 * Called every 60 seconds from server.ts via setInterval.
 *
 * Logic:
 *  1. Query pending outbox rows where send_after <= NOW()
 *  2. Mark each as "sending" (prevents double-processing on concurrent runs)
 *  3. Fetch all Delivery_Email_Items for each outbox row
 *  4. Build a consolidated HTML email listing all delivered products
 *  5. Send via emailService
 *  6. Mark as "sent" or "failed"
 */

import { db } from "@/lib/db";
import { deliveryEmailOutbox, deliveryEmailItems } from "@/lib/db/schema";
import { and, lte, eq, inArray } from "drizzle-orm";
import { emailService } from "./email-service";

type OutboxRow = typeof deliveryEmailOutbox.$inferSelect;
type ItemRow   = typeof deliveryEmailItems.$inferSelect;

export interface WorkerResult {
  processed: number;
  sent:      number;
  failed:    number;
  skipped:   number;
  errors:    string[];
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function processDeliveryEmailQueue(): Promise<WorkerResult> {
  const result: WorkerResult = {
    processed: 0,
    sent:      0,
    failed:    0,
    skipped:   0,
    errors:    [],
  };

  const now = new Date();

  // 1. Find all pending outbox entries that are due
  const pending = await db
    .select()
    .from(deliveryEmailOutbox)
    .where(
      and(
        eq(deliveryEmailOutbox.status, "pending"),
        lte(deliveryEmailOutbox.sendAfter, now)
      )
    );

  if (!pending.length) return result;

  // 2. Mark them all as "sending" atomically to prevent double-processing
  const ids = pending.map((p) => p.id);
  await db
    .update(deliveryEmailOutbox)
    .set({ status: "sending" })
    .where(inArray(deliveryEmailOutbox.id, ids));

  // 3. Process each outbox entry
  for (const outbox of pending) {
    result.processed++;

    try {
      // Fetch all delivery items for this batch
      const items = await db
        .select()
        .from(deliveryEmailItems)
        .where(eq(deliveryEmailItems.outboxId, outbox.id));

      if (!items.length) {
        // Nothing to send — mark done silently
        await markSent(outbox.id);
        result.skipped++;
        continue;
      }

      // Build and send email
      const { subject, html } = buildBatchEmail(outbox, items);

      const emailResult = await emailService.send(
        {
          to: {
            email: outbox.recipientEmail,
            name:  outbox.recipientName || undefined,
          },
          subject,
          html,
        },
        { template: "delivery-batch", jobId: items[0]?.jobId }
      );

      if (emailResult.success) {
        await markSent(outbox.id);
        result.sent++;
      } else {
        const errMsg = emailResult.error || "Send failed";
        await markFailed(outbox.id, errMsg);
        result.failed++;
        result.errors.push(`Outbox #${outbox.id}: ${errMsg}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      await markFailed(outbox.id, errMsg);
      result.failed++;
      result.errors.push(`Outbox #${outbox.id}: ${errMsg}`);
    }
  }

  return result;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function markSent(id: number): Promise<void> {
  await db
    .update(deliveryEmailOutbox)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(deliveryEmailOutbox.id, id));
}

async function markFailed(id: number, errorMessage: string): Promise<void> {
  await db
    .update(deliveryEmailOutbox)
    .set({ status: "failed", errorMessage })
    .where(eq(deliveryEmailOutbox.id, id));
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildBatchEmail(
  outbox: OutboxRow,
  items: ItemRow[]
): { subject: string; html: string } {
  const name    = outbox.recipientName || "Client";
  const count   = items.length;
  const subject = `Your ProDrones ${count === 1 ? "delivery is" : `${count} deliveries are`} ready`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://client.prodrones.com";

  const itemRows = items
    .map((item) => {
      const linkHtml = buildItemLink(item, appUrl);
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-weight:600;margin-bottom:4px">
              Job #${item.jobId} — ${escapeHtml(item.productName)}
            </div>
            <div style="font-size:14px;color:#4b5563">
              ${linkHtml}
            </div>
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">

          <!-- Header -->
          <tr>
            <td style="background:#1e3a5f;padding:24px 32px">
              <div style="color:#ffffff;font-size:20px;font-weight:700">ProDrones Hub</div>
              <div style="color:#93c5fd;font-size:13px;margin-top:2px">Professional Drone Solutions</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px">
              <h2 style="margin:0 0 8px;font-size:22px;color:#111827">
                Your ${count === 1 ? "delivery is" : "deliveries are"} ready
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px">
                Hi ${escapeHtml(name)}, the following
                ${count === 1 ? "item has" : `${count} items have`} been delivered to your account.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>

              <div style="margin-top:28px;text-align:center">
                <a href="${appUrl}"
                   style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600">
                  View in Client Portal
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 32px;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
                This email was sent by ProDrones Hub. If you have questions, contact your project manager.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function buildItemLink(item: ItemRow, appUrl: string): string {
  if (!item.deliveryContent) return "Available in your portal";

  const content = item.deliveryContent;
  const label =
    item.deliveryType === "link"    ? "View Delivery"      :
    item.deliveryType === "tileset" ? "Open Map Viewer"    :
    item.deliveryType === "file"    ? "Download File"      :
    "View";

  // If content is already a full URL, use it directly
  const href = content.startsWith("http") ? content : `${appUrl}${content}`;

  return `<a href="${escapeHtml(href)}" style="color:#2563eb;text-decoration:none;font-weight:500">${label} →</a>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
