/**
 * workflow-emails.ts
 *
 * Reusable email helpers for workflow events.
 * Called from job pipeline endpoints (schedule, deliver) and bulk equivalents.
 *
 * All errors are caught and logged — email failures never break pipeline actions.
 */

import { db } from "@/lib/db";
import { users, userMeta, organizationMeta } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { emailService } from "@/modules/email/services/email-service";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobSummary {
  id: number;
  name: string | null;
  clientId: number | null;
  clientType: string | null;
  clientName: string;
  siteName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch full name + email for a list of user IDs.
 * Name comes from User_Meta (first_name + last_name), email from Users table.
 */
async function getPilotContacts(
  pilotIds: number[]
): Promise<{ id: number; name: string; email: string }[]> {
  if (pilotIds.length === 0) return [];

  const [emailRows, metaRows] = await Promise.all([
    db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.id, pilotIds)),
    db
      .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
      .from(userMeta)
      .where(inArray(userMeta.uid, pilotIds)),
  ]);

  // Build name map from meta
  const names: Record<number, { first?: string; last?: string }> = {};
  for (const m of metaRows) {
    if (m.metaKey === "first_name" || m.metaKey === "last_name") {
      if (!names[m.uid]) names[m.uid] = {};
      if (m.metaKey === "first_name") names[m.uid].first = m.metaValue || "";
      if (m.metaKey === "last_name")  names[m.uid].last  = m.metaValue || "";
    }
  }

  return emailRows.map((u) => ({
    id: u.id,
    email: u.email,
    name: [names[u.id]?.first, names[u.id]?.last].filter(Boolean).join(" ") || u.email,
  }));
}

/**
 * Resolve the client's email address.
 * - clientType "user"         → Users.email
 * - clientType "organization" → primary contact's email (from Organization_Meta contacts JSON)
 */
async function getClientEmail(
  clientId: number,
  clientType: string | null
): Promise<string | null> {
  try {
    if (clientType === "user") {
      const [row] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, clientId));
      return row?.email ?? null;
    }

    if (clientType === "organization") {
      // Get contacts JSON from org meta
      const [meta] = await db
        .select({ metaValue: organizationMeta.metaValue })
        .from(organizationMeta)
        .where(and(
          eq(organizationMeta.orgId, clientId),
          eq(organizationMeta.metaKey, "contacts")
        ));

      if (!meta?.metaValue) return null;

      let contacts: { user_id?: number; primary?: boolean }[] = [];
      try {
        const parsed = JSON.parse(meta.metaValue);
        // Support both [{user_id, primary}] and legacy [number]
        contacts = Array.isArray(parsed)
          ? parsed.map((c: any) => (typeof c === "number" ? { user_id: c } : c))
          : [];
      } catch {
        return null;
      }

      // Prefer primary contact; fall back to first
      const primary = contacts.find((c) => c.primary && c.user_id);
      const first   = contacts.find((c) => c.user_id);
      const userId  = primary?.user_id ?? first?.user_id;
      if (!userId) return null;

      const [row] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId));
      return row?.email ?? null;
    }
  } catch {
    // swallow — caller handles null
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send pilot-notification emails to all assigned pilots.
 * action = "scheduled" when scheduling a job for the first time.
 */
export async function sendPilotNotifications(
  pilotIds: number[],
  job: JobSummary,
  action: "assigned" | "scheduled" | "rescheduled" | "cancelled",
  scheduledDate?: string
): Promise<void> {
  if (pilotIds.length === 0) return;
  try {
    const pilots = await getPilotContacts(pilotIds);
    await Promise.allSettled(
      pilots.map((pilot) =>
        emailService.sendTemplate({
          to: { email: pilot.email, name: pilot.name },
          template: "pilot-notification",
          data: {
            pilotName:     pilot.name,
            jobId:         job.id,
            jobTitle:      job.name || `Job #${job.id}`,
            clientName:    job.clientName,
            scheduledDate: scheduledDate,
            action,
          },
        })
      )
    );
  } catch (err) {
    console.error("[workflow-emails] sendPilotNotifications failed:", err);
  }
}

/**
 * Send delivery-notification email to the job's client.
 */
export async function sendDeliveryNotification(
  job: JobSummary,
  deliveredDate: string
): Promise<void> {
  if (!job.clientId) return;
  try {
    const clientEmail = await getClientEmail(job.clientId, job.clientType);
    if (!clientEmail) return;

    await emailService.sendTemplate({
      to: { email: clientEmail, name: job.clientName },
      template: "delivery-notification",
      data: {
        clientName:   job.clientName,
        jobId:        job.id,
        jobTitle:     job.name || `Job #${job.id}`,
        deliveryDate: deliveredDate,
      },
    });
  } catch (err) {
    console.error("[workflow-emails] sendDeliveryNotification failed:", err);
  }
}
