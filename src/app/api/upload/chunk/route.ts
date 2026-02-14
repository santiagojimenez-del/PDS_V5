import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { uploadChunkSchema } from "@/modules/upload/schemas/upload-schemas";
import { uploadChunk as uploadChunkService } from "@/modules/upload/services/upload-service";

export const POST = withAuth(async (user, req) => {
    try {
        const formData = await req.formData();
        const uploadId = formData.get("uploadId") as string;
        const chunkIndex = parseInt(formData.get("chunkIndex") as string);
        const checksum = formData.get("checksum") as string | null;
        const chunkFile = formData.get("chunk") as File;

        if (!chunkFile) {
            return errorResponse("No chunk file provided");
        }

        // Validate input
        const parsed = uploadChunkSchema.safeParse({
            uploadId,
            chunkIndex,
            checksum: checksum || undefined,
        });

        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0].message);
        }

        // Convert File to Buffer
        const arrayBuffer = await chunkFile.arrayBuffer();
        const chunkData = Buffer.from(arrayBuffer);

        const result = await uploadChunkService({
            uploadId: parsed.data.uploadId,
            chunkIndex: parsed.data.chunkIndex,
            chunkData,
            checksum: parsed.data.checksum,
        });

        return successResponse(result);
    } catch (error: any) {
        console.error("[API] Upload chunk error:", error);
        return errorResponse(error.message || "Failed to upload chunk", 500);
    }
});

// Increase body size limit for chunks (e.g., 10MB)
export const config = {
    api: {
        bodyParser: false, // Disable default body parser for FormData
    },
};
