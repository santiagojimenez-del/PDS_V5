import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, userMeta, jobs, sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, notFoundResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";

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
