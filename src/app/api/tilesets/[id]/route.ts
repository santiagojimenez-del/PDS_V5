import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tilesets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";

function getIdFromUrl(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const id = parseInt(segments[segments.length - 1], 10);
  return isNaN(id) ? null : id;
}

// ── GET /api/tilesets/[id] ────────────────────────────────────────────────────
export const GET = withAuth(async (_user, req: NextRequest) => {
  const id = getIdFromUrl(req);
  if (!id) return errorResponse("Invalid ID", 400);

  const [row] = await db
    .select()
    .from(tilesets)
    .where(eq(tilesets.id, id));

  if (!row) return notFoundResponse("Tileset not found");

  return successResponse({
    ...row,
    published: row.published === 1,
  });
});

// ── PUT /api/tilesets/[id] — update name, description, preset, published ──────
export const PUT = withAuth(async (_user, req: NextRequest) => {
  const id = getIdFromUrl(req);
  if (!id) return errorResponse("Invalid ID", 400);

  const [existing] = await db.select({ id: tilesets.id }).from(tilesets).where(eq(tilesets.id, id));
  if (!existing) return notFoundResponse("Tileset not found");

  const body = await req.json();
  const { name, description, preset, published } = body;

  const updates: Partial<typeof tilesets.$inferInsert> = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = description ? String(description).trim() : null;
  if (preset !== undefined) updates.preset = preset ? String(preset).trim() : null;
  if (published !== undefined) updates.published = published ? 1 : 0;

  if (Object.keys(updates).length === 0) return errorResponse("Nothing to update", 400);

  await db.update(tilesets).set(updates).where(eq(tilesets.id, id));
  return successResponse({ message: "Tileset updated" });
});

// ── DELETE /api/tilesets/[id] ─────────────────────────────────────────────────
export const DELETE = withAuth(async (_user, req: NextRequest) => {
  const id = getIdFromUrl(req);
  if (!id) return errorResponse("Invalid ID", 400);

  const [existing] = await db.select({ id: tilesets.id }).from(tilesets).where(eq(tilesets.id, id));
  if (!existing) return notFoundResponse("Tileset not found");

  await db.delete(tilesets).where(eq(tilesets.id, id));
  return successResponse({ message: "Tileset deleted" });
});
