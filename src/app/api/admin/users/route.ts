import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { withRole } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";

export const GET = withRole([ROLES.ADMIN], async (_user, req: NextRequest) => {
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .orderBy(users.id);

  // Get meta for all users
  const metaRows = await db
    .select({
      uid: userMeta.uid,
      metaKey: userMeta.metaKey,
      metaValue: userMeta.metaValue,
    })
    .from(userMeta);

  const metaByUser: Record<number, Record<string, string | null>> = {};
  for (const m of metaRows) {
    if (!metaByUser[m.uid]) metaByUser[m.uid] = {};
    metaByUser[m.uid][m.metaKey] = m.metaValue;
  }

  const enriched = userRows.map((u) => {
    const meta = metaByUser[u.id] || {};
    let roles: number[] = [];
    try {
      roles = JSON.parse(meta.roles || "[]");
    } catch { /* ignore */ }

    return {
      id: u.id,
      email: u.email,
      firstName: meta.first_name || "",
      lastName: meta.last_name || "",
      fullName: [meta.first_name, meta.last_name].filter(Boolean).join(" "),
      roles,
      phoneNumber: meta.phone_number || null,
      twoFactorEnabled: meta.two_factor_required === "true" || meta.two_factor_required === "1",
    };
  });

  return successResponse({ users: enriched, total: enriched.length });
});
