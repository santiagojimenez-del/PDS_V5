import { z } from "zod";

// ── Upload Session Schemas ───────────────────────────────────────────────────

export const initiateUploadSchema = z.object({
    fileName: z.string().min(1).max(255),
    fileSize: z.number().positive(),
    mimeType: z.string().optional(),
    chunkSize: z.number().positive().default(5242880), // 5MB default
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const uploadChunkSchema = z.object({
    uploadId: z.string().uuid(),
    chunkIndex: z.number().int().nonnegative(),
    checksum: z.string().optional(),
});

export const completeUploadSchema = z.object({
    uploadId: z.string().uuid(),
});

export const cancelUploadSchema = z.object({
    uploadId: z.string().uuid(),
});

export const getUploadStatusSchema = z.object({
    uploadId: z.string().uuid(),
});

export const resumeUploadSchema = z.object({
    uploadId: z.string().uuid(),
});
