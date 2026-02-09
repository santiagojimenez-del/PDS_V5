import { eq, and, sql } from "drizzle-orm";
import type { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import type { Database } from "./index";

/**
 * Get a single meta value from an EAV meta table.
 *
 * @param db       - The Drizzle database instance
 * @param table    - The meta table (e.g. userMeta, jobMeta, organizationMeta)
 * @param entityIdCol - The column object for the entity foreign key (e.g. userMeta.uid)
 * @param entityId - The entity ID value
 * @param key      - The meta_key to look up
 * @returns The meta_value string or null if not found
 */
export async function getMetaValue<T extends MySqlTableWithColumns<any>>(
  db: Database,
  table: T,
  entityIdCol: T["_"]["columns"][string],
  entityId: number,
  key: string
): Promise<string | null> {
  const rows = await db
    .select({
      metaValue: (table as any).metaValue ?? (table as any).meta_value,
    })
    .from(table)
    .where(
      and(
        eq(entityIdCol, entityId),
        eq((table as any).metaKey ?? (table as any).meta_key, key)
      )
    )
    .limit(1);

  return rows.length > 0 ? rows[0].metaValue : null;
}

/**
 * Upsert a meta value (INSERT ... ON DUPLICATE KEY UPDATE).
 *
 * @param db       - The Drizzle database instance
 * @param table    - The meta table
 * @param entityIdCol - The column object for the entity foreign key
 * @param entityId - The entity ID value
 * @param key      - The meta_key
 * @param value    - The meta_value to set
 */
export async function setMetaValue<T extends MySqlTableWithColumns<any>>(
  db: Database,
  table: T,
  entityIdCol: T["_"]["columns"][string],
  entityId: number,
  key: string,
  value: string
): Promise<void> {
  const entityColName = (entityIdCol as any).name as string;
  const tableName = (table as any)[Symbol.for("drizzle:Name")] ?? getTableName(table);

  await db.execute(
    sql`INSERT INTO ${sql.raw(tableName)} (${sql.raw(entityColName)}, meta_key, meta_value)
        VALUES (${entityId}, ${key}, ${value})
        ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`
  );
}

/**
 * Get all meta rows for an entity as a key-value object.
 *
 * @param db       - The Drizzle database instance
 * @param table    - The meta table
 * @param entityIdCol - The column object for the entity foreign key
 * @param entityId - The entity ID value
 * @returns An object mapping meta_key -> meta_value
 */
export async function getMetaMap<T extends MySqlTableWithColumns<any>>(
  db: Database,
  table: T,
  entityIdCol: T["_"]["columns"][string],
  entityId: number
): Promise<Record<string, string>> {
  const rows = await db
    .select({
      metaKey: (table as any).metaKey ?? (table as any).meta_key,
      metaValue: (table as any).metaValue ?? (table as any).meta_value,
    })
    .from(table)
    .where(eq(entityIdCol, entityId));

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.metaKey] = row.metaValue;
  }
  return map;
}

/**
 * Delete a single meta value.
 *
 * @param db       - The Drizzle database instance
 * @param table    - The meta table
 * @param entityIdCol - The column object for the entity foreign key
 * @param entityId - The entity ID value
 * @param key      - The meta_key to delete
 */
export async function deleteMetaValue<T extends MySqlTableWithColumns<any>>(
  db: Database,
  table: T,
  entityIdCol: T["_"]["columns"][string],
  entityId: number,
  key: string
): Promise<void> {
  await db
    .delete(table)
    .where(
      and(
        eq(entityIdCol, entityId),
        eq((table as any).metaKey ?? (table as any).meta_key, key)
      )
    );
}

/**
 * Call the stored procedure `updateJobPipeline` for a given job ID.
 *
 * @param db    - The Drizzle database instance
 * @param jobId - The job ID to pass to the stored procedure
 */
export async function callUpdateJobPipeline(
  db: Database,
  jobId: number
): Promise<void> {
  await db.execute(sql`CALL update_job_pipeline(${jobId})`);
}

// ── Internal helper ──────────────────────────────────────────────────────────

function getTableName(table: any): string {
  // Drizzle stores the SQL name via the Table symbol or _.name
  if (table._ && table._.name) return table._.name;
  const symbols = Object.getOwnPropertySymbols(table);
  for (const sym of symbols) {
    if (sym.toString().includes("Name")) {
      return table[sym];
    }
  }
  throw new Error("Could not resolve table name from Drizzle table object");
}
