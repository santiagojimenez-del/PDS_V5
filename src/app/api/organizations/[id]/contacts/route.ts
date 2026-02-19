/**
 * /api/organizations/[id]/contacts
 *
 * GET    — list contacts with user details
 * POST   — add a contact       { userId: number }
 * DELETE — remove a contact    { userId: number }
 * PATCH  — make contact primary { userId: number }
 */

import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import {
  addOrgContact,
  removeOrgContact,
  makePrimaryOrgContact,
  enrichContacts,
  getOrganizationById,
} from "@/modules/organizations/services/organization-service";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

// ── GET /api/organizations/[id]/contacts ──────────────────────────────────────

export async function GET(req: NextRequest, ctx: Ctx) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const orgId = parseId(id);
    if (!orgId) return errorResponse("Invalid organization ID", 400);

    const org = await getOrganizationById(orgId);
    if (!org) return notFoundResponse("Organization not found");

    const contacts = await enrichContacts(org.contacts || []);
    return successResponse({ contacts });
  })(req);
}

// ── POST /api/organizations/[id]/contacts ─────────────────────────────────────

export async function POST(req: NextRequest, ctx: Ctx) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const orgId = parseId(id);
    if (!orgId) return errorResponse("Invalid organization ID", 400);

    const body = await req.json();
    const userId = parseInt(body?.userId, 10);
    if (isNaN(userId) || userId < 1) return errorResponse("Invalid userId", 400);

    try {
      const contacts = await addOrgContact(orgId, userId);
      const enriched = await enrichContacts(contacts);
      return successResponse({ contacts: enriched });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add contact";
      return errorResponse(msg, msg.includes("not found") ? 404 : 409);
    }
  })(req);
}

// ── DELETE /api/organizations/[id]/contacts ───────────────────────────────────

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const orgId = parseId(id);
    if (!orgId) return errorResponse("Invalid organization ID", 400);

    const body = await req.json();
    const userId = parseInt(body?.userId, 10);
    if (isNaN(userId) || userId < 1) return errorResponse("Invalid userId", 400);

    try {
      const contacts = await removeOrgContact(orgId, userId);
      const enriched = await enrichContacts(contacts);
      return successResponse({ contacts: enriched });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove contact";
      return errorResponse(msg, msg.includes("not found") ? 404 : 400);
    }
  })(req);
}

// ── PATCH /api/organizations/[id]/contacts ────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return withAuth(async () => {
    const { id } = await ctx.params;
    const orgId = parseId(id);
    if (!orgId) return errorResponse("Invalid organization ID", 400);

    const body = await req.json();
    const userId = parseInt(body?.userId, 10);
    if (isNaN(userId) || userId < 1) return errorResponse("Invalid userId", 400);

    try {
      const contacts = await makePrimaryOrgContact(orgId, userId);
      const enriched = await enrichContacts(contacts);
      return successResponse({ contacts: enriched });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update primary contact";
      return errorResponse(msg, msg.includes("not found") ? 404 : 400);
    }
  })(req);
}
