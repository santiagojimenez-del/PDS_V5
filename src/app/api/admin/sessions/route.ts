import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { withRole } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";
import { ROLES } from "@/lib/constants";

export const GET = withRole([ROLES.ADMIN], async (_user, _req: NextRequest) => {
  // Get all users and check for active session tokens
  const userRows = await db
    .select({ id: users.id, email: users.email, tokens: users.tokens })
    .from(users);

  // Get meta for all users (first_name, last_name, roles)
  const metaRows = await db
    .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
    .from(userMeta);

  const metaByUser: Record<number, Record<string, string | null>> = {};
  for (const m of metaRows) {
    if (!metaByUser[m.uid]) metaByUser[m.uid] = {};
    metaByUser[m.uid][m.metaKey] = m.metaValue;
  }

  const now = Date.now();
  const sessions: Array<{
    userId: number;
    email: string;
    fullName: string;
    roles: number[];
    sessionCount: number;
  }> = [];

  for (const u of userRows) {
    let tokens: Array<{ type: string; expiry: number }> = [];
    try {
      tokens = Array.isArray(u.tokens) ? u.tokens as typeof tokens : JSON.parse(u.tokens as string || "[]");
    } catch { continue; }

    // Count active session tokens (not expired)
    const activeSessions = tokens.filter(
      (t) => (t.type === "session" || t.type === "two-factor-session") && t.expiry * 1000 > now
    );

    if (activeSessions.length > 0) {
      const meta = metaByUser[u.id] || {};
      let roles: number[] = [];
      try { roles = JSON.parse(meta.roles || "[]"); } catch { /* ignore */ }

      sessions.push({
        userId: u.id,
        email: u.email,
        fullName: [meta.first_name, meta.last_name].filter(Boolean).join(" "),
        roles,
        sessionCount: activeSessions.length,
      });
    }
  }

  return successResponse({ sessions, total: sessions.length });
});
