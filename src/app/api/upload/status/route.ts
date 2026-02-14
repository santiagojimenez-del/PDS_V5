import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { getUploadStatusSchema } from "@/modules/upload/schemas/upload-schemas";
import { getUploadStatus as getUploadStatusService, getMissingChunks } from "@/modules/upload/services/upload-service";

export const GET = withAuth(async (user, req) => {
    try {
        const { searchParams } = new URL(req.url);
        const uploadId = searchParams.get("uploadId");

        if (!uploadId) {
            return errorResponse("Missing uploadId parameter");
        }

        const parsed = getUploadStatusSchema.safeParse({ uploadId });

        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0].message);
        }

        const status = await getUploadStatusService(parsed.data.uploadId);
        const missingChunks = await getMissingChunks(parsed.data.uploadId);

        return successResponse({
            ...status,
            missingChunks,
        });
    } catch (error: any) {
        console.error("[API] Get upload status error:", error);
        return errorResponse(error.message || "Failed to get upload status", 500);
    }
});
