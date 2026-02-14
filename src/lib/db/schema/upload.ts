import {
    mysqlTable,
    int,
    varchar,
    bigint,
    datetime,
    mysqlEnum,
    text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ── Upload_Session ───────────────────────────────────────────────────────────
export const uploadSession = mysqlTable("Upload_Session", {
    id: int("id").autoincrement().primaryKey().notNull(),
    uploadId: varchar("upload_id", { length: 255 }).notNull().unique(),
    userId: int("user_id").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    chunkSize: int("chunk_size").notNull().default(5242880), // 5MB default
    totalChunks: int("total_chunks").notNull(),
    uploadedChunks: int("uploaded_chunks").notNull().default(0),
    status: mysqlEnum("status", [
        "pending",
        "uploading",
        "completed",
        "failed",
        "cancelled",
    ])
        .notNull()
        .default("pending"),
    tempPath: text("temp_path"), // Path to temp directory for chunks
    finalPath: text("final_path"), // Final path after assembly
    metadata: text("metadata"), // JSON string for additional metadata
    errorMessage: text("error_message"),
    createdAt: datetime("created_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`)
        .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
    completedAt: datetime("completed_at"),
});

// ── Upload_Chunk ─────────────────────────────────────────────────────────────
export const uploadChunk = mysqlTable("Upload_Chunk", {
    id: int("id").autoincrement().primaryKey().notNull(),
    sessionId: int("session_id")
        .notNull()
        .references(() => uploadSession.id, { onDelete: "cascade" }),
    chunkIndex: int("chunk_index").notNull(),
    chunkSize: int("chunk_size").notNull(),
    checksum: varchar("checksum", { length: 64 }), // MD5 or SHA256
    uploadedAt: datetime("uploaded_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});
