/**
 * Share Link API
 *
 * POST /api/share  — create a new share link for a page
 * DELETE /api/share — revoke an existing share link
 * GET /api/share?pageId=X — list all shares for a page (authenticated)
 */

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { shares } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { generateToken } from "@/lib/auth/crypto";
import { z } from "zod";

// ── Expiry options ────────────────────────────────────────────────────────────
const EXPIRY_MAP: Record<string, number | null> = {
  "1h":    1 * 60 * 60,
  "24h":   24 * 60 * 60,
  "7d":    7 * 24 * 60 * 60,
  "30d":   30 * 24 * 60 * 60,
  "never": 0, // 0 → null (no expiry)
};

const createShareSchema = z.object({
  pageId:       z.number().int().positive(),
  expiry:       z.enum(["1h", "24h", "7d", "30d", "never"]).default("7d"),
  requestToken: z.string().max(350).optional(),
});

const deleteShareSchema = z.object({
  shareId: z.number().int().positive(),
});

// ── POST — create share ───────────────────────────────────────────────────────
export const POST = withAuth(async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = createShareSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { pageId, expiry, requestToken } = parsed.data;

    const expirySeconds = EXPIRY_MAP[expiry];
    const expiresAt = expirySeconds
      ? Math.floor(Date.now() / 1000) + expirySeconds
      : null;

    const token = generateToken(48);

    const tokenObj = {
      token,
      expire: expiresAt,
    };

    const userObj = {
      id:    user.id,
      email: user.email,
      name:  `${user.firstName} ${user.lastName}`.trim() || user.email,
    };

    const result = await db
      .insert(shares)
      .values({
        token:        JSON.stringify(tokenObj),
        user:         JSON.stringify(userObj),
        pageId,
        requestToken: requestToken ?? null,
      })
      .$returningId();

    return successResponse(
      {
        shareId:   result[0].id,
        token,
        expiresAt,
        expiresLabel: expiry === "never" ? "Never" : expiry,
      },
      201
    );
  } catch (err) {
    console.error("[Share] Create error:", err);
    return errorResponse("Failed to create share link", 500);
  }
});

// ── DELETE — revoke share ─────────────────────────────────────────────────────
export const DELETE = withAuth(async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = deleteShareSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const { shareId } = parsed.data;

    // Only the creator or an admin can revoke
    const existing = await db
      .select({ id: shares.id, user: shares.user })
      .from(shares)
      .where(eq(shares.id, shareId))
      .limit(1);

    if (!existing.length) {
      return errorResponse("Share not found", 404);
    }

    const shareUser = existing[0].user as { id: number } | null;
    const isAdmin   = user.roles.includes(0);
    const isOwner   = shareUser?.id === user.id;

    if (!isAdmin && !isOwner) {
      return errorResponse("Not authorized to revoke this share", 403);
    }

    await db.delete(shares).where(eq(shares.id, shareId));

    return successResponse({ revoked: true });
  } catch (err) {
    console.error("[Share] Revoke error:", err);
    return errorResponse("Failed to revoke share link", 500);
  }
});

// ── GET — list shares for a page ─────────────────────────────────────────────
export const GET = withAuth(async (user, req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = parseInt(searchParams.get("pageId") ?? "");

    if (!pageId || isNaN(pageId)) {
      return errorResponse("pageId is required", 422);
    }

    const rows = await db
      .select()
      .from(shares)
      .where(eq(shares.pageId, pageId));

    const now = Math.floor(Date.now() / 1000);

    const formatted = rows.map((row) => {
      const tokenObj = row.token as { token: string; expire: number | null };
      const expired  = tokenObj.expire ? now > tokenObj.expire : false;
      return {
        shareId:      row.id,
        token:        tokenObj.token,
        expiresAt:    tokenObj.expire,
        expired,
        user:         row.user,
        requestToken: row.requestToken,
      };
    });

    return successResponse({ shares: formatted });
  } catch (err) {
    console.error("[Share] List error:", err);
    return errorResponse("Failed to fetch shares", 500);
  }
});
