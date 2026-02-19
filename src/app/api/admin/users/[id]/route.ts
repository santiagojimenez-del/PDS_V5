import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, userMeta, jobs, sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";
import { setMetaValue, deleteMetaValue } from "@/lib/db/helpers";
import { hashPassword } from "@/lib/auth/crypto";

export const GET = withRole([ROLES.ADMIN], async (_user, req: NextRequest) => {
  // Extract user ID from URL path: /api/admin/users/123
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const userId = parseInt(segments[segments.length - 1], 10);
  if (isNaN(userId)) return notFoundResponse("Invalid user ID");

  const [userRow] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!userRow) return notFoundResponse("User not found");

  // Get all meta for this user
  const metaRows = await db
    .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
    .from(userMeta)
    .where(eq(userMeta.uid, userId));

  const meta: Record<string, string | null> = {};
  for (const m of metaRows) meta[m.metaKey] = m.metaValue;

  let roles: number[] = [];
  try { roles = JSON.parse(meta.roles || "[]"); } catch { /* ignore */ }

  let permissions: string[] = [];
  try { permissions = JSON.parse(meta.permissions || "[]"); } catch { /* ignore */ }

  // Get jobs created by this user
  const userJobs = await db
    .select({ id: jobs.id, name: jobs.name, pipeline: jobs.pipeline })
    .from(jobs)
    .where(eq(jobs.createdBy, userId));

  // Get sites created by this user
  const userSites = await db
    .select({ id: sites.id, name: sites.name })
    .from(sites)
    .where(eq(sites.createdBy, userId));

  return successResponse({
    id: userRow.id,
    email: userRow.email,
    firstName: meta.first_name || "",
    lastName: meta.last_name || "",
    fullName: [meta.first_name, meta.last_name].filter(Boolean).join(" "),
    roles,
    permissions,
    phoneNumber: meta.phone_number || null,
    twoFactorEnabled: meta.two_factor_required === "true" || meta.two_factor_required === "1",
    googleAddonLinked: !!meta.google_addon_refresh_token,
    jobsCreated: userJobs.length,
    sitesCreated: userSites.length,
    recentJobs: userJobs.slice(0, 10),
    recentSites: userSites.slice(0, 10),
  });
});

// ── PUT /api/admin/users/[id] — update profile, roles, permissions ────────────
export const PUT = withRole([ROLES.ADMIN], async (_admin, req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const userId = parseInt(segments[segments.length - 1], 10);
  if (isNaN(userId)) return errorResponse("Invalid user ID", 400);

  const body = await req.json();
  const { firstName, lastName, phoneNumber, roles, permissions } = body;

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return notFoundResponse("User not found");

  if (firstName !== undefined) {
    if (firstName) await setMetaValue(db, userMeta, userMeta.uid, userId, "first_name", firstName);
    else await deleteMetaValue(db, userMeta, userMeta.uid, userId, "first_name");
  }
  if (lastName !== undefined) {
    if (lastName) await setMetaValue(db, userMeta, userMeta.uid, userId, "last_name", lastName);
    else await deleteMetaValue(db, userMeta, userMeta.uid, userId, "last_name");
  }
  if (phoneNumber !== undefined) {
    if (phoneNumber) await setMetaValue(db, userMeta, userMeta.uid, userId, "phone_number", phoneNumber);
    else await deleteMetaValue(db, userMeta, userMeta.uid, userId, "phone_number");
  }
  if (Array.isArray(roles)) {
    await setMetaValue(db, userMeta, userMeta.uid, userId, "roles", JSON.stringify(roles));
  }
  if (Array.isArray(permissions)) {
    await setMetaValue(db, userMeta, userMeta.uid, userId, "permissions", JSON.stringify(permissions));
  }

  return successResponse({ message: "User updated" });
});

// ── DELETE /api/admin/users/[id] — delete user ────────────────────────────────
export const DELETE = withRole([ROLES.ADMIN], async (_admin, req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const userId = parseInt(segments[segments.length - 1], 10);
  if (isNaN(userId)) return errorResponse("Invalid user ID", 400);

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return notFoundResponse("User not found");

  await db.delete(userMeta).where(eq(userMeta.uid, userId));
  await db.delete(users).where(eq(users.id, userId));

  return successResponse({ message: "User deleted" });
});

// ── PATCH /api/admin/users/[id] — special actions ────────────────────────────
// Body: { action: "kill-sessions" | "change-password", newPassword?: string }
export const PATCH = withRole([ROLES.ADMIN], async (_admin, req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const userId = parseInt(segments[segments.length - 1], 10);
  if (isNaN(userId)) return errorResponse("Invalid user ID", 400);

  const body = await req.json();
  const { action } = body;

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return notFoundResponse("User not found");

  if (action === "kill-sessions") {
    // Clear all tokens
    await db.update(users).set({ tokens: JSON.stringify([]) }).where(eq(users.id, userId));
    return successResponse({ message: "All sessions terminated" });
  }

  if (action === "change-password") {
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }
    const hashed = await hashPassword(newPassword);
    // Change password and kill all sessions
    await db.update(users).set({ password: hashed, tokens: JSON.stringify([]) }).where(eq(users.id, userId));
    return successResponse({ message: "Password changed and sessions terminated" });
  }

  return errorResponse("Unknown action", 400);
});
