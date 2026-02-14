import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { completeUploadSchema } from "@/modules/upload/schemas/upload-schemas";
import { completeUpload as completeUploadService } from "@/modules/upload/services/upload-service";

export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json();
        const parsed = completeUploadSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0].message);
        }

        const result = await completeUploadService(parsed.data.uploadId);

        return successResponse(result);
    } catch (error: any) {
        console.error("[API] Complete upload error:", error);
        return errorResponse(error.message || "Failed to complete upload", 500);
    }
});
