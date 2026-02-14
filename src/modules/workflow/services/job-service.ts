import { db } from "@/lib/db";
import { jobs, jobMeta, sites, organization, userMeta, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getMetaMap } from "@/lib/db/helpers";

export async function getJobById(jobId: number) {
  const rows = await db
    .select({
      id: jobs.id,
      pipeline: jobs.pipeline,
      name: jobs.name,
      createdBy: jobs.createdBy,
      client: jobs.client,
      clientId: jobs.clientId,
      clientType: jobs.clientType,
      dates: jobs.dates,
      siteId: jobs.siteId,
      products: jobs.products,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!rows.length) return null;

  const job = rows[0];

  // Load meta
  const meta = await getMetaMap(db, jobMeta, jobMeta.jobId, jobId);

  // Load site name
  let siteName = "Unknown Site";
  if (job.siteId) {
    const siteRows = await db
      .select({ name: sites.name })
      .from(sites)
      .where(eq(sites.id, job.siteId))
      .limit(1);
    if (siteRows.length) siteName = siteRows[0].name;
  }

  // Load client name
  const clientId = job.clientId ? parseInt(job.clientId) : null;
  let clientName = "Unknown";
  if (clientId) {
    if (job.clientType === "organization") {
      const orgRows = await db
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, clientId))
        .limit(1);
      if (orgRows.length) clientName = orgRows[0].name;
    } else if (job.clientType === "user") {
      const metaRows = await db
        .select({ metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
        .from(userMeta)
        .where(eq(userMeta.uid, clientId));
      const nameMap: Record<string, string> = {};
      for (const m of metaRows) {
        if (m.metaKey === "first_name" || m.metaKey === "last_name") {
          nameMap[m.metaKey] = m.metaValue || "";
        }
      }
      clientName = [nameMap.first_name, nameMap.last_name].filter(Boolean).join(" ") || "Unknown";
    }
  }

  // Load product names - products can be [1,2] (numbers) or [{id:1,name:"X"}] (objects from seed)
  const rawProducts = Array.isArray(job.products) ? job.products : [];
  const productIds = rawProducts.map((p: any) => (typeof p === "number" ? p : p?.id));
  const numericIds = productIds.filter((id: any): id is number => typeof id === "number");
  let productList: { id: number; name: string }[] = [];
  if (numericIds.length > 0) {
    const productRows = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(inArray(products.id, numericIds));
    const productMap: Record<number, string> = {};
    for (const p of productRows) productMap[p.id] = p.name;
    productList = numericIds.map((pid) => ({ id: pid, name: productMap[pid] || `Product ${pid}` }));
  }

  return {
    id: job.id,
    pipeline: job.pipeline,
    name: job.name,
    createdBy: job.createdBy,
    siteId: job.siteId,
    siteName,
    clientId,
    clientType: job.clientType,
    clientName,
    dates: job.dates as Record<string, string>,
    products: productList,
    meta,
  };
}

export async function updateJobDates(jobId: number, newDates: Record<string, string>) {
  const rows = await db
    .select({ dates: jobs.dates })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!rows.length) return;

  const existing = (rows[0].dates as Record<string, string>) || {};
  const merged = { ...existing, ...newDates };

  await db.update(jobs).set({ dates: merged }).where(eq(jobs.id, jobId));
}

export async function getJobMeta(jobId: number): Promise<Record<string, string>> {
  return getMetaMap(db, jobMeta, jobMeta.jobId, jobId);
}
