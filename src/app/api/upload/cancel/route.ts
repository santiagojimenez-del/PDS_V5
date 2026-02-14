import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { cancelUploadSchema } from "@/modules/upload/schemas/upload-schemas";
import { cancelUpload as cancelUploadService } from "@/modules/upload/services/upload-service";

export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json();
        const parsed = cancelUploadSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0].message);
        }

        const result = await cancelUploadService(parsed.data.uploadId);

        return successResponse(result);
    } catch (error: any) {
        console.error("[API] Cancel upload error:", error);
        return errorResponse(error.message || "Failed to cancel upload", 500);
    }
});
