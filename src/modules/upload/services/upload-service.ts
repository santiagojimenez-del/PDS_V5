import { db } from "@/lib/db";
import { uploadSession, uploadChunk as uploadChunkTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const UPLOAD_TEMP_DIR = process.env.UPLOAD_TEMP_DIR || "./uploads/temp";
const UPLOAD_FINAL_DIR = process.env.UPLOAD_FINAL_DIR || "./uploads/final";

// Ensure upload directories exist
async function ensureUploadDirs() {
    await fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true });
    await fs.mkdir(UPLOAD_FINAL_DIR, { recursive: true });
}

export interface InitiateUploadParams {
    userId: number;
    fileName: string;
    fileSize: number;
    mimeType?: string;
    chunkSize?: number;
    metadata?: Record<string, unknown>;
}

export interface UploadChunkParams {
    uploadId: string;
    chunkIndex: number;
    chunkData: Buffer;
    checksum?: string;
}

/**
 * Initiate a new chunked upload session
 */
export async function initiateUpload(params: InitiateUploadParams) {
    await ensureUploadDirs();

    const uploadId = randomUUID();
    const chunkSize = params.chunkSize || 5242880; // 5MB default
    const totalChunks = Math.ceil(params.fileSize / chunkSize);

    const tempPath = path.join(UPLOAD_TEMP_DIR, uploadId);
    await fs.mkdir(tempPath, { recursive: true });

    const [result] = await db.insert(uploadSession).values({
        uploadId,
        userId: params.userId,
        fileName: params.fileName,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        chunkSize,
        totalChunks,
        uploadedChunks: 0,
        status: "pending",
        tempPath,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });

    return {
        uploadId,
        chunkSize,
        totalChunks,
        sessionId: result.insertId,
    };
}

/**
 * Upload a single chunk
 */
export async function uploadChunk(params: UploadChunkParams) {
    // Get session
    const sessions = await db
        .select()
        .from(uploadSession)
        .where(eq(uploadSession.uploadId, params.uploadId))
        .limit(1);

    if (!sessions.length) {
        throw new Error("Upload session not found");
    }

    const session = sessions[0];

    if (session.status === "completed") {
        throw new Error("Upload already completed");
    }

    if (session.status === "cancelled") {
        throw new Error("Upload was cancelled");
    }

    // Validate chunk index
    if (params.chunkIndex < 0 || params.chunkIndex >= session.totalChunks) {
        throw new Error("Invalid chunk index");
    }

    // Check if chunk already uploaded
    const existingChunks = await db
        .select()
        .from(uploadChunkTable)
        .where(
            and(
                eq(uploadChunkTable.sessionId, session.id),
                eq(uploadChunkTable.chunkIndex, params.chunkIndex)
            )
        )
        .limit(1);

    if (existingChunks.length > 0) {
        // Chunk already uploaded, skip
        return { alreadyUploaded: true };
    }

    // Verify checksum if provided
    if (params.checksum) {
        const hash = createHash("md5").update(params.chunkData).digest("hex");
        if (hash !== params.checksum) {
            throw new Error("Checksum mismatch");
        }
    }

    // Write chunk to disk
    const chunkPath = path.join(session.tempPath!, `chunk_${params.chunkIndex}`);
    await fs.writeFile(chunkPath, params.chunkData);

    // Record chunk in database
    await db.insert(uploadChunkTable).values({
        sessionId: session.id,
        chunkIndex: params.chunkIndex,
        chunkSize: params.chunkData.length,
        checksum: params.checksum,
    });

    // Update session
    const newUploadedChunks = session.uploadedChunks + 1;
    await db
        .update(uploadSession)
        .set({
            uploadedChunks: newUploadedChunks,
            status: newUploadedChunks === session.totalChunks ? "uploading" : "uploading",
        })
        .where(eq(uploadSession.id, session.id));

    return {
        chunkIndex: params.chunkIndex,
        uploadedChunks: newUploadedChunks,
        totalChunks: session.totalChunks,
        progress: (newUploadedChunks / session.totalChunks) * 100,
    };
}

/**
 * Complete upload by assembling all chunks
 */
export async function completeUpload(uploadId: string) {
    const sessions = await db
        .select()
        .from(uploadSession)
        .where(eq(uploadSession.uploadId, uploadId))
        .limit(1);

    if (!sessions.length) {
        throw new Error("Upload session not found");
    }

    const session = sessions[0];

    if (session.uploadedChunks !== session.totalChunks) {
        throw new Error(
            `Not all chunks uploaded. ${session.uploadedChunks}/${session.totalChunks}`
        );
    }

    // Assemble chunks
    const finalPath = path.join(UPLOAD_FINAL_DIR, `${uploadId}_${session.fileName}`);
    const writeStream = await fs.open(finalPath, "w");

    try {
        for (let i = 0; i < session.totalChunks; i++) {
            const chunkPath = path.join(session.tempPath!, `chunk_${i}`);
            const chunkData = await fs.readFile(chunkPath);
            await writeStream.write(chunkData);
        }
    } finally {
        await writeStream.close();
    }

    // Clean up temp directory
    await fs.rm(session.tempPath!, { recursive: true, force: true });

    // Update session
    await db
        .update(uploadSession)
        .set({
            status: "completed",
            finalPath,
            completedAt: new Date(),
        })
        .where(eq(uploadSession.id, session.id));

    return {
        uploadId,
        fileName: session.fileName,
        finalPath,
        fileSize: session.fileSize,
    };
}

/**
 * Get upload status
 */
export async function getUploadStatus(uploadId: string) {
    const sessions = await db
        .select()
        .from(uploadSession)
        .where(eq(uploadSession.uploadId, uploadId))
        .limit(1);

    if (!sessions.length) {
        throw new Error("Upload session not found");
    }

    const session = sessions[0];

    return {
        uploadId: session.uploadId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        chunkSize: session.chunkSize,
        totalChunks: session.totalChunks,
        uploadedChunks: session.uploadedChunks,
        status: session.status,
        progress: (session.uploadedChunks / session.totalChunks) * 100,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
    };
}

/**
 * Cancel upload
 */
export async function cancelUpload(uploadId: string) {
    const sessions = await db
        .select()
        .from(uploadSession)
        .where(eq(uploadSession.uploadId, uploadId))
        .limit(1);

    if (!sessions.length) {
        throw new Error("Upload session not found");
    }

    const session = sessions[0];

    // Clean up temp directory if exists
    if (session.tempPath) {
        await fs.rm(session.tempPath, { recursive: true, force: true }).catch(() => { });
    }

    // Update session
    await db
        .update(uploadSession)
        .set({
            status: "cancelled",
        })
        .where(eq(uploadSession.id, session.id));

    return { uploadId, status: "cancelled" };
}

/**
 * Get missing chunks for resume capability
 */
export async function getMissingChunks(uploadId: string): Promise<number[]> {
    const sessions = await db
        .select()
        .from(uploadSession)
        .where(eq(uploadSession.uploadId, uploadId))
        .limit(1);

    if (!sessions.length) {
        throw new Error("Upload session not found");
    }

    const session = sessions[0];

    const uploadedChunks = await db
        .select({ chunkIndex: uploadChunkTable.chunkIndex })
        .from(uploadChunkTable)
        .where(eq(uploadChunkTable.sessionId, session.id));

    const uploadedIndices = new Set(uploadedChunks.map((c) => c.chunkIndex));
    const missing: number[] = [];

    for (let i = 0; i < session.totalChunks; i++) {
        if (!uploadedIndices.has(i)) {
            missing.push(i);
        }
    }

    return missing;
}
