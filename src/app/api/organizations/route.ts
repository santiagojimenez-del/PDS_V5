import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organization, organizationMeta, jobs } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/utils/api";

export const GET = withAuth(async (_user, req: NextRequest) => {
  const orgRows = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .orderBy(organization.name);

  // Get meta for all orgs
  const metaRows = await db
    .select({
      orgId: organizationMeta.orgId,
      metaKey: organizationMeta.metaKey,
      metaValue: organizationMeta.metaValue,
    })
    .from(organizationMeta);

  const metaByOrg: Record<number, Record<string, string>> = {};
  for (const m of metaRows) {
    if (!metaByOrg[m.orgId]) metaByOrg[m.orgId] = {};
    metaByOrg[m.orgId][m.metaKey] = m.metaValue;
  }

  // Get job counts per org (client_type = 'organization')
  const jobCounts = await db
    .select({ clientId: jobs.clientId, count: count() })
    .from(jobs)
    .where(eq(jobs.clientType, "organization"))
    .groupBy(jobs.clientId);

  const jobCountMap: Record<string, number> = {};
  for (const jc of jobCounts) {
    if (jc.clientId) jobCountMap[jc.clientId] = jc.count;
  }

  const enriched = orgRows.map((o) => {
    const meta = metaByOrg[o.id] || {};
    let contactCount = 0;
    try {
      const contacts = JSON.parse(meta.contacts || "[]");
      contactCount = Array.isArray(contacts) ? contacts.length : 0;
    } catch { /* ignore */ }

    return {
      id: o.id,
      name: o.name,
      address: meta.address || null,
      logo: meta.logo || null,
      contactCount,
      jobCount: jobCountMap[String(o.id)] || 0,
    };
  });

  return successResponse({ organizations: enriched, total: enriched.length });
});
