import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, users, userMeta, jobs } from "@/lib/db/schema";
import { eq, inArray, count, sql } from "drizzle-orm";
import { withAuth, withPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { z } from "zod";

export const GET = withAuth(async (_user, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const siteRows = await db
    .select({
      id: sites.id,
      name: sites.name,
      description: sites.description,
      address: sites.address,
      coordinates: sites.coordinates,
      boundary: sites.boundary,
      createdBy: sites.createdBy,
    })
    .from(sites)
    .limit(limit)
    .offset(offset)
    .orderBy(sites.name);

  // Get job counts per site
  const jobCounts = await db
    .select({ siteId: jobs.siteId, count: count() })
    .from(jobs)
    .groupBy(jobs.siteId);

  const jobCountMap: Record<number, number> = {};
  for (const jc of jobCounts) jobCountMap[jc.siteId] = jc.count;

  // Get creator names
  const creatorIds = [...new Set(siteRows.map((s) => s.createdBy))];
  const creatorMap: Record<number, string> = {};
  if (creatorIds.length > 0) {
    const metaRows = await db
      .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
      .from(userMeta)
      .where(inArray(userMeta.uid, creatorIds));

    const temp: Record<number, { first?: string; last?: string }> = {};
    for (const m of metaRows) {
      if (m.metaKey === "first_name" || m.metaKey === "last_name") {
        if (!temp[m.uid]) temp[m.uid] = {};
        if (m.metaKey === "first_name") temp[m.uid].first = m.metaValue || "";
        if (m.metaKey === "last_name") temp[m.uid].last = m.metaValue || "";
      }
    }
    for (const [uid, n] of Object.entries(temp)) {
      creatorMap[parseInt(uid)] = [n.first, n.last].filter(Boolean).join(" ");
    }
  }

  const totalResult = await db.select({ total: count() }).from(sites);

  const enriched = siteRows.map((s) => {
    let coords: unknown = s.coordinates;
    if (typeof coords === "string") {
      try { coords = JSON.parse(coords); } catch { coords = null; }
    }
    // Normalize {lat,lng} object to [lat, lng] tuple for the map component
    let coordsTuple: [number, number] | null = null;
    if (coords && typeof coords === "object" && !Array.isArray(coords)) {
      const obj = coords as Record<string, unknown>;
      if (typeof obj.lat === "number" && typeof obj.lng === "number") {
        coordsTuple = [obj.lat, obj.lng];
      }
    } else if (Array.isArray(coords) && coords.length >= 2) {
      coordsTuple = [coords[0], coords[1]];
    }

    let bounds = s.boundary;
    if (typeof bounds === "string") {
      try { bounds = JSON.parse(bounds); } catch { bounds = null; }
    }
    // Normalize GeoJSON Polygon to [[lat, lng], ...] for Leaflet
    let boundaryTuples: [number, number][] | null = null;
    if (bounds && typeof bounds === "object" && !Array.isArray(bounds)) {
      const geo = bounds as Record<string, unknown>;
      if (geo.type === "Polygon" && Array.isArray(geo.coordinates)) {
        const ring = (geo.coordinates as number[][][])[0];
        if (ring) {
          // GeoJSON is [lng, lat] → Leaflet needs [lat, lng]
          boundaryTuples = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
        }
      }
    } else if (Array.isArray(bounds)) {
      boundaryTuples = bounds as [number, number][];
    }

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      address: s.address,
      coordinates: coordsTuple,
      boundary: boundaryTuples,
      createdBy: creatorMap[s.createdBy] || "Unknown",
      jobCount: jobCountMap[s.id] || 0,
    };
  });

  return successResponse({ sites: enriched, total: totalResult[0].total });
});

const createSiteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  address: z.string().optional().default(""),
  description: z.string().optional().default(""),
  lat: z.number({ message: "Latitude must be a number" }).min(-90).max(90),
  lng: z.number({ message: "Longitude must be a number" }).min(-180).max(180),
});

export const POST = withPermission("create_project_site", async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = createSiteSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { name, address, description, lat, lng } = parsed.data;

    const result = await db.insert(sites).values({
      name,
      address: address || null,
      description: description || null,
      coordinates: { lat, lng },
      boundary: null,
      createdBy: user.id,
    });

    const insertedId = result[0].insertId;

    return successResponse({ id: insertedId, name }, 201);
  } catch (error) {
    console.error("[API] Create site error:", error);
    return errorResponse("Failed to create site", 500);
  }
});
