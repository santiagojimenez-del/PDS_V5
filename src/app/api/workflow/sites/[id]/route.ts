import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, jobs, userMeta } from "@/lib/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { z } from "zod";

function extractSiteId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const id = parseInt(segments[segments.length - 1]);
  return isNaN(id) ? null : id;
}

/**
 * GET /api/workflow/sites/[id]
 * Returns full site details including associated jobs.
 */
export const GET = withAuth(async (_user, req: NextRequest) => {
  const siteId = extractSiteId(req);
  if (!siteId) return errorResponse("Invalid site ID");

  try {
    const siteRows = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);

    if (!siteRows.length) return notFoundResponse("Site not found");

    const site = siteRows[0];

    // Get creator name
    const metaRows = await db
      .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
      .from(userMeta)
      .where(eq(userMeta.uid, site.createdBy));

    const nameMap: Record<string, string> = {};
    for (const m of metaRows) {
      if (m.metaKey === "first_name" || m.metaKey === "last_name") {
        nameMap[m.metaKey] = m.metaValue || "";
      }
    }
    const createdByName = [nameMap.first_name, nameMap.last_name].filter(Boolean).join(" ") || "Unknown";

    // Get associated jobs
    const jobRows = await db
      .select({
        id: jobs.id,
        name: jobs.name,
        pipeline: jobs.pipeline,
        dates: jobs.dates,
      })
      .from(jobs)
      .where(eq(jobs.siteId, siteId))
      .orderBy(jobs.id);

    // Normalize coordinates
    let coords = site.coordinates as any;
    if (typeof coords === "string") { try { coords = JSON.parse(coords); } catch { coords = null; } }
    let coordsTuple: [number, number] | null = null;
    if (coords && !Array.isArray(coords) && typeof coords === "object") {
      if (typeof coords.lat === "number" && typeof coords.lng === "number") {
        coordsTuple = [coords.lat, coords.lng];
      }
    } else if (Array.isArray(coords) && coords.length >= 2) {
      coordsTuple = [coords[0], coords[1]];
    }

    // Normalize boundary (stored as GeoJSON Polygon or array of [lat, lng])
    let boundary = site.boundary as any;
    if (typeof boundary === "string") { try { boundary = JSON.parse(boundary); } catch { boundary = null; } }

    return successResponse({
      id: site.id,
      name: site.name,
      description: site.description,
      address: site.address,
      coordinates: coordsTuple,
      boundary: boundary,
      createdBy: site.createdBy,
      createdByName,
      jobs: jobRows,
    });
  } catch (error) {
    console.error("[Sites API] Get site error:", error);
    return errorResponse("Failed to get site", 500);
  }
});

const updateSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  boundary: z.any().optional(), // GeoJSON Polygon or null
});

/**
 * PATCH /api/workflow/sites/[id]
 * Update site info and/or boundary.
 */
export const PATCH = withAuth(async (_user, req: NextRequest) => {
  const siteId = extractSiteId(req);
  if (!siteId) return errorResponse("Invalid site ID");

  try {
    const existing = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);

    if (!existing.length) return notFoundResponse("Site not found");

    const body = await req.json();
    const parsed = updateSiteSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const updateData: any = {};

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null;

    // Update coordinates if lat/lng provided
    if (parsed.data.lat !== undefined && parsed.data.lng !== undefined) {
      updateData.coordinates = { lat: parsed.data.lat, lng: parsed.data.lng };
    }

    // Update boundary if provided (null = clear it)
    if ("boundary" in parsed.data) {
      updateData.boundary = parsed.data.boundary ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No fields to update");
    }

    await db.update(sites).set(updateData).where(eq(sites.id, siteId));

    return successResponse({ id: siteId, updated: true });
  } catch (error) {
    console.error("[Sites API] Update site error:", error);
    return errorResponse("Failed to update site", 500);
  }
});

/**
 * DELETE /api/workflow/sites/[id]
 * Delete a site. Blocked if it has associated jobs.
 */
export const DELETE = withAuth(async (_user, req: NextRequest) => {
  const siteId = extractSiteId(req);
  if (!siteId) return errorResponse("Invalid site ID");

  try {
    const existing = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);

    if (!existing.length) return notFoundResponse("Site not found");

    // Block deletion if jobs exist
    const [jobCount] = await db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.siteId, siteId));

    if (jobCount.value > 0) {
      return errorResponse(`Cannot delete site with ${jobCount.value} associated job(s)`);
    }

    await db.delete(sites).where(eq(sites.id, siteId));

    return successResponse({ deleted: siteId });
  } catch (error) {
    console.error("[Sites API] Delete site error:", error);
    return errorResponse("Failed to delete site", 500);
  }
});
