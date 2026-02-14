import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jobs, jobMeta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { editJobSchema } from "@/modules/workflow/schemas/job-schemas";
import { setMetaValue } from "@/lib/db/helpers";
import { getJobById } from "@/modules/workflow/services/job-service";

function extractJobId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const id = parseInt(segments[segments.length - 1]);
  return isNaN(id) ? null : id;
}

export const GET = withAuth(async (_user, req: NextRequest) => {
  const jobId = extractJobId(req);
  if (!jobId) return errorResponse("Invalid job ID");

  const job = await getJobById(jobId);
  if (!job) return notFoundResponse("Job not found");

  return successResponse(job);
});

export const POST = withAuth(async (user, req: NextRequest) => {
  const jobId = extractJobId(req);
  if (!jobId) return errorResponse("Invalid job ID");

  const existing = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!existing.length) return notFoundResponse("Job not found");

  try {
    const body = await req.json();
    const parsed = editJobSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { name, siteId, clientId, clientType, products, notes, amountPayable } = parsed.data;

    // Build update object for jobs table
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (siteId !== undefined) update.siteId = siteId;
    if (products !== undefined) update.products = products;

    // If clientId or clientType changed, update the client JSON
    if (clientId !== undefined || clientType !== undefined) {
      const currentJob = await db.select({ client: jobs.client }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
      const current = (currentJob[0]?.client as { id?: number; type?: string }) || {};
      update.client = {
        id: clientId ?? current.id,
        type: clientType ?? current.type ?? "organization",
      };
    }

    if (Object.keys(update).length > 0) {
      await db.update(jobs).set(update).where(eq(jobs.id, jobId));
    }

    // Update meta values
    if (notes !== undefined) {
      await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "notes", notes);
    }
    if (amountPayable !== undefined) {
      await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "amount_payable", amountPayable);
    }

    const updated = await getJobById(jobId);
    return successResponse(updated);
  } catch (error) {
    console.error("[API] Edit job error:", error);
    return errorResponse("Failed to edit job", 500);
  }
});

export const DELETE = withAuth(async (_user, req: NextRequest) => {
  const jobId = extractJobId(req);
  if (!jobId) return errorResponse("Invalid job ID");

  const existing = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!existing.length) return notFoundResponse("Job not found");

  try {
    // Delete meta first (FK constraint)
    await db.delete(jobMeta).where(eq(jobMeta.jobId, jobId));
    // Delete the job
    await db.delete(jobs).where(eq(jobs.id, jobId));

    return successResponse({ deleted: jobId });
  } catch (error) {
    console.error("[API] Delete job error:", error);
    return errorResponse("Failed to delete job", 500);
  }
});
