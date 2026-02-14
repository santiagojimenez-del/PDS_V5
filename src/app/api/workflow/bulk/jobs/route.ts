import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { getJobById } from "@/modules/workflow/services/job-service";
import { bulkGetJobsSchema } from "@/modules/workflow/schemas/bulk-schemas";

export const GET = withAuth(async (user, req) => {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) return errorResponse("Missing 'ids' query parameter");

    const parsed = bulkGetJobsSchema.safeParse({ ids: idsParam });
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const jobIds = parsed.data.ids;
    const jobs = await Promise.all(jobIds.map((id) => getJobById(id)));

    return successResponse(jobs.filter(Boolean));
});
