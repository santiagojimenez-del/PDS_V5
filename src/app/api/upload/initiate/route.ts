import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { initiateUploadSchema } from "@/modules/upload/schemas/upload-schemas";
import { initiateUpload } from "@/modules/upload/services/upload-service";

export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json();
        const parsed = initiateUploadSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0].message);
        }

        const result = await initiateUpload({
            userId: user.id,
            ...parsed.data,
        });

        return successResponse(result);
    } catch (error: any) {
        console.error("[API] Initiate upload error:", error);
        return errorResponse(error.message || "Failed to initiate upload", 500);
    }
});
