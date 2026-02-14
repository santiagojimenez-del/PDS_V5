import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobDeliverable } from "@/lib/db/schema/jobs";

/**
 * Get all deliverable meta rows for a jobProductId as a key-value map.
 */
export async function getDeliverableMap(
  jobProductId: string
): Promise<Record<string, string>> {
  const rows = await db
    .select({
      metaKey: jobDeliverable.metaKey,
      metaValue: jobDeliverable.metaValue,
    })
    .from(jobDeliverable)
    .where(eq(jobDeliverable.jobProductId, jobProductId));

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.metaKey] = row.metaValue;
  }
  return map;
}

/**
 * Get a single deliverable value by key.
 */
export async function getDeliverableValue(
  jobProductId: string,
  key: string
): Promise<string | null> {
  const rows = await db
    .select({ metaValue: jobDeliverable.metaValue })
    .from(jobDeliverable)
    .where(
      and(
        eq(jobDeliverable.jobProductId, jobProductId),
        eq(jobDeliverable.metaKey, key)
      )
    )
    .limit(1);

  return rows.length > 0 ? rows[0].metaValue : null;
}

/**
 * Upsert a deliverable value (INSERT ... ON DUPLICATE KEY UPDATE).
 */
export async function setDeliverableValue(
  jobProductId: string,
  key: string,
  value: string
): Promise<void> {
  await db.execute(
    sql`INSERT INTO Job_Deliverable (job_product_id, meta_key, meta_value)
        VALUES (${jobProductId}, ${key}, ${value})
        ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`
  );
}

/**
 * Delete a single deliverable value.
 */
export async function deleteDeliverableValue(
  jobProductId: string,
  key: string
): Promise<void> {
  await db
    .delete(jobDeliverable)
    .where(
      and(
        eq(jobDeliverable.jobProductId, jobProductId),
        eq(jobDeliverable.metaKey, key)
      )
    );
}

/**
 * Parse a JSON deliverable value safely.
 */
export function parseDeliverableJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify a value for storage in deliverable meta.
 */
export function stringifyDeliverableJSON(value: unknown): string {
  return JSON.stringify(value);
}
