import { db } from "@/lib/db";
import { users, userMeta, organization, organizationMeta } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async () => {
  // 1. Get all org contacts mappings
  const orgContactRows = await db
    .select({ orgId: organizationMeta.orgId, metaValue: organizationMeta.metaValue })
    .from(organizationMeta)
    .where(eq(organizationMeta.metaKey, "contacts"));

  // Build org -> user IDs map and user -> org ID map
  const userToOrg: Record<number, number> = {};
  const allContactIds: number[] = [];

  for (const row of orgContactRows) {
    let ids: number[] = [];
    try {
      const parsed = typeof row.metaValue === "string" ? JSON.parse(row.metaValue) : row.metaValue;
      if (Array.isArray(parsed)) ids = parsed.map(Number).filter((n: number) => !isNaN(n));
    } catch { /* skip */ }

    for (const uid of ids) {
      userToOrg[uid] = row.orgId;
      allContactIds.push(uid);
    }
  }

  if (allContactIds.length === 0) {
    return successResponse({ contacts: [], total: 0 });
  }

  const uniqueIds = [...new Set(allContactIds)];

  // 2. Get user emails
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.id, uniqueIds));

  const emailMap: Record<number, string> = {};
  for (const u of userRows) emailMap[u.id] = u.email;

  // 3. Get user meta (first_name, last_name, phone_number)
  const metaRows = await db
    .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
    .from(userMeta)
    .where(inArray(userMeta.uid, uniqueIds));

  const metaMap: Record<number, Record<string, string>> = {};
  for (const m of metaRows) {
    if (["first_name", "last_name", "phone_number"].includes(m.metaKey)) {
      if (!metaMap[m.uid]) metaMap[m.uid] = {};
      metaMap[m.uid][m.metaKey] = m.metaValue || "";
    }
  }

  // 4. Get org names
  const orgIds = [...new Set(Object.values(userToOrg))];
  const orgRows = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(inArray(organization.id, orgIds));

  const orgNameMap: Record<number, string> = {};
  for (const o of orgRows) orgNameMap[o.id] = o.name;

  // 5. Build response
  const contacts = uniqueIds
    .filter((uid) => emailMap[uid])
    .map((uid) => {
      const meta = metaMap[uid] || {};
      const orgId = userToOrg[uid];
      return {
        id: uid,
        firstName: meta.first_name || "",
        lastName: meta.last_name || "",
        email: emailMap[uid],
        phone: meta.phone_number || "",
        orgId,
        orgName: orgNameMap[orgId] || "Unknown",
      };
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  return successResponse({ contacts, total: contacts.length });
});
