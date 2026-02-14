import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { tilesets } from "@/lib/db/schema/tilesets";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from "@/lib/utils/api";
import { getDeliverableValue, parseDeliverableJSON } from "@/modules/viewers/services/deliverables";
import type { AuthUser } from "@/modules/auth/types";

// GET /api/viewer/[jobProductId]/tileset - Get tileset info for this deliverable
export const GET = withAuth(async (user: AuthUser, req: NextRequest) => {
  const url = new URL(req.url);
  // Extract jobProductId from path: /api/viewer/{jobProductId}/tileset
  const segments = url.pathname.split("/");
  const tilesetIdx = segments.indexOf("tileset");
  const jobProductId = tilesetIdx > 0 ? segments[tilesetIdx - 1] : null;

  if (!jobProductId) return errorResponse("Missing jobProductId");

  // Read tileset_id from deliverables
  const tilesetIdStr = await getDeliverableValue(jobProductId, "tileset_id");
  if (!tilesetIdStr) {
    return successResponse({ tileset: null, message: "No tileset assigned" });
  }

  const tilesetId = parseInt(tilesetIdStr, 10);
  if (isNaN(tilesetId)) return errorResponse("Invalid tileset_id in deliverables");

  const [tileset] = await db
    .select()
    .from(tilesets)
    .where(eq(tilesets.id, tilesetId))
    .limit(1);

  if (!tileset) return notFoundResponse("Tileset not found");

  // Parse tileset_options JSON
  let tilesetOptions = null;
  if (tileset.tilesetOptions) {
    try {
      tilesetOptions = JSON.parse(tileset.tilesetOptions);
    } catch { /* ignore */ }
  }

  return successResponse({
    tileset: {
      id: tileset.id,
      name: tileset.name,
      path: tileset.path,
      attribution: tileset.attribution,
      preset: tileset.preset,
      tilesetOptions,
    },
  });
});
