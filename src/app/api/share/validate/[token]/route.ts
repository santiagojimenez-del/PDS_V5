/**
 * GET /api/share/validate/[token]
 *
 * Public endpoint — no auth required.
 * Validates a share token and returns the associated page + request data.
 * Used by middleware or page components to render shared content.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shares, pages } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // Query directly using MySQL JSON path — avoids loading the entire table.
    // The token column stores: { "token": "...", "expire": null | number }
    const matchedShares = await db
      .select({
        id:           shares.id,
        token:        shares.token,
        user:         shares.user,
        pageId:       shares.pageId,
        requestToken: shares.requestToken,
      })
      .from(shares)
      .where(sql`JSON_UNQUOTE(JSON_EXTRACT(${shares.token}, '$.token')) = ${token}`)
      .limit(1);

    if (!matchedShares.length) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired share link" },
        { status: 404 }
      );
    }

    const match = matchedShares[0];

    // Validate expiry in application layer
    const tokenObj = match.token as { token: string; expire: number | null };
    if (tokenObj.expire && now > tokenObj.expire) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired share link" },
        { status: 404 }
      );
    }

    // Fetch the associated page metadata
    const pageRows = await db
      .select({
        pageId:      pages.pageId,
        application: pages.application,
        page:        pages.page,
        wrapper:     pages.wrapper,
        template:    pages.template,
        shareable:   pages.shareable,
        roleAccess:  pages.roleAccess,
        design:      pages.design,
      })
      .from(pages)
      .where(eq(pages.pageId, match.pageId))
      .limit(1);

    if (!pageRows.length) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    const page = pageRows[0];

    // Ensure the page is actually shareable
    if (!page.shareable) {
      return NextResponse.json(
        { success: false, error: "This page is not shareable" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        shareId:      match.id,
        token,
        expiresAt:    tokenObj.expire,
        user:         match.user,
        requestToken: match.requestToken,
        page: {
          pageId:      page.pageId,
          application: page.application,
          page:        page.page,
          wrapper:     page.wrapper,
          template:    page.template,
          design:      page.design,
        },
      },
    });
  } catch (err) {
    console.error("[Share Validate] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
