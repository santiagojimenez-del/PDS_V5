import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tilesets, userMeta } from "@/lib/db/schema";
import { inArray, count } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async (_user, req: NextRequest) => {
  const tilesetRows = await db
    .select({
      id: tilesets.id,
      name: tilesets.name,
      description: tilesets.description,
      path: tilesets.path,
      published: tilesets.published,
      preset: tilesets.preset,
      createdBy: tilesets.createdBy,
    })
    .from(tilesets)
    .orderBy(tilesets.name);

  // Get creator names
  const creatorIds = [...new Set(tilesetRows.map((t) => t.createdBy).filter(Boolean))] as number[];
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

  const enriched = tilesetRows.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    path: t.path,
    published: t.published === 1,
    preset: t.preset,
    createdBy: t.createdBy ? creatorMap[t.createdBy] || "Unknown" : null,
  }));

  return successResponse({ tilesets: enriched, total: enriched.length });
});
