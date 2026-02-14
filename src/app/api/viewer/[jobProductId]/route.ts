import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema/jobs";
import { sites } from "@/lib/db/schema/sites";
import { products } from "@/lib/db/schema/products";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/lib/utils/api";
import {
  getDeliverableMap,
  setDeliverableValue,
} from "@/modules/viewers/services/deliverables";
import { ROLES, HUB_ROLES } from "@/lib/constants";
import type { AuthUser } from "@/modules/auth/types";

function parseJobProductId(jobProductId: string): { jobId: number; productIndex: number } | null {
  const parts = jobProductId.split("-");
  if (parts.length !== 2) return null;
  const jobId = parseInt(parts[0], 10);
  const productIndex = parseInt(parts[1], 10);
  if (isNaN(jobId) || isNaN(productIndex)) return null;
  return { jobId, productIndex };
}

async function hasAccess(user: AuthUser, jobId: number): Promise<boolean> {
  // Hub roles (admin, manager, staff, pilot) have access to all jobs
  if (user.roles.some((r) => HUB_ROLES.includes(r as any))) return true;

  // Clients can access their own jobs
  const [job] = await db
    .select({ clientId: jobs.clientId, createdBy: jobs.createdBy })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) return false;
  return job.clientId === String(user.id) || job.createdBy === user.id;
}

// GET /api/viewer/[jobProductId] - Fetch job + product info + all deliverables
export const GET = withAuth(async (user: AuthUser, req: NextRequest) => {
  const url = new URL(req.url);
  const jobProductId = url.pathname.split("/api/viewer/")[1]?.split("/")[0];
  if (!jobProductId) return errorResponse("Missing jobProductId");

  const parsed = parseJobProductId(jobProductId);
  if (!parsed) return errorResponse("Invalid jobProductId format. Expected: {jobId}-{productIndex}");

  const { jobId, productIndex } = parsed;

  // Fetch job
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) return notFoundResponse("Job not found");

  // Check access
  if (!(await hasAccess(user, jobId))) {
    return forbiddenResponse("You do not have access to this job");
  }

  // Get product from job.products array
  const jobProducts = job.products as Array<Record<string, unknown>>;
  if (!jobProducts || productIndex >= jobProducts.length) {
    return notFoundResponse("Product not found at index " + productIndex);
  }
  const product = jobProducts[productIndex];

  // Fetch site info
  const [site] = await db
    .select({ id: sites.id, name: sites.name, coordinates: sites.coordinates, boundary: sites.boundary })
    .from(sites)
    .where(eq(sites.id, job.siteId))
    .limit(1);

  // Fetch all deliverables
  const deliverables = await getDeliverableMap(jobProductId);

  return successResponse({
    job: {
      id: job.id,
      name: job.name,
      pipeline: job.pipeline,
      siteId: job.siteId,
    },
    product,
    productIndex,
    site: site || null,
    deliverables,
  });
});

// PUT /api/viewer/[jobProductId] - Upsert a deliverable { key, value }
export const PUT = withAuth(async (user: AuthUser, req: NextRequest) => {
  const url = new URL(req.url);
  const jobProductId = url.pathname.split("/api/viewer/")[1]?.split("/")[0];
  if (!jobProductId) return errorResponse("Missing jobProductId");

  const parsed = parseJobProductId(jobProductId);
  if (!parsed) return errorResponse("Invalid jobProductId format");

  // Check job exists
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.id, parsed.jobId))
    .limit(1);

  if (!job) return notFoundResponse("Job not found");

  // Check access
  if (!(await hasAccess(user, parsed.jobId))) {
    return forbiddenResponse("You do not have access to this job");
  }

  const body = await req.json();
  const { key, value } = body as { key?: string; value?: string };

  if (!key || typeof key !== "string") return errorResponse("Missing or invalid 'key'");
  if (value === undefined || value === null) return errorResponse("Missing 'value'");

  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  await setDeliverableValue(jobProductId, key, stringValue);

  return successResponse({ key, saved: true });
});
