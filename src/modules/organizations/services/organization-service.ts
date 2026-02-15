import { db } from "@/lib/db";
import { organization, organizationMeta, jobs } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { setMetaValue, getMetaMap, deleteMetaValue } from "@/lib/db/helpers";
import type { Organization } from "../types";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "../schemas/organization-schemas";

/**
 * Get organization by ID with metadata
 */
export async function getOrganizationById(id: number): Promise<Organization | null> {
  const orgRows = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);

  if (!orgRows.length) return null;

  const org = orgRows[0];

  // Get metadata
  const meta = await getMetaMap(db, organizationMeta, organizationMeta.orgId, id);

  // Parse contacts array
  let contacts: number[] = [];
  try {
    const contactsJson = meta.contacts || "[]";
    contacts = JSON.parse(contactsJson);
  } catch {
    /* ignore */
  }

  // Get job count
  const jobCountResult = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.clientId, String(id)));

  const jobCount = jobCountResult[0]?.count || 0;

  return {
    id: org.id,
    name: org.name,
    address: meta.address || null,
    streetAddress: meta.StreetAddress || null,
    city: meta.City || null,
    state: meta.State || null,
    zipCode: meta.ZipCode || null,
    logo: meta.logo || null,
    contacts,
    contactCount: contacts.length,
    jobCount,
  };
}

/**
 * Create a new organization with metadata
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  // Insert organization
  const insertResult = await db
    .insert(organization)
    .values({
      name: input.name,
    })
    .$returningId();

  const orgId = insertResult[0].id;

  // Set metadata
  if (input.address) {
    await setMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "address", input.address);
  }
  if (input.streetAddress) {
    await setMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "StreetAddress", input.streetAddress);
  }
  if (input.city) {
    await setMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "City", input.city);
  }
  if (input.state) {
    await setMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "State", input.state);
  }
  if (input.zipCode) {
    await setMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "ZipCode", input.zipCode);
  }
  if (input.logo) {
    await setMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "logo", input.logo);
  }
  if (input.contacts && input.contacts.length > 0) {
    await setMetaValue(
      db,
      organizationMeta,
      organizationMeta.orgId,
      orgId,
      "contacts",
      JSON.stringify(input.contacts)
    );
  }

  // Return created organization
  const created = await getOrganizationById(orgId);
  if (!created) {
    throw new Error("Failed to retrieve created organization");
  }

  return created;
}

/**
 * Update an organization with metadata
 */
export async function updateOrganization(
  id: number,
  input: UpdateOrganizationInput
): Promise<Organization | null> {
  // Check if organization exists
  const existing = await getOrganizationById(id);
  if (!existing) return null;

  // Update name if provided
  if (input.name !== undefined) {
    await db
      .update(organization)
      .set({ name: input.name })
      .where(eq(organization.id, id));
  }

  // Update metadata
  if (input.address !== undefined) {
    if (input.address) {
      await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "address", input.address);
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "address");
    }
  }
  if (input.streetAddress !== undefined) {
    if (input.streetAddress) {
      await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "StreetAddress", input.streetAddress);
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "StreetAddress");
    }
  }
  if (input.city !== undefined) {
    if (input.city) {
      await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "City", input.city);
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "City");
    }
  }
  if (input.state !== undefined) {
    if (input.state) {
      await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "State", input.state);
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "State");
    }
  }
  if (input.zipCode !== undefined) {
    if (input.zipCode) {
      await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "ZipCode", input.zipCode);
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "ZipCode");
    }
  }
  if (input.logo !== undefined) {
    if (input.logo) {
      await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "logo", input.logo);
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "logo");
    }
  }
  if (input.contacts !== undefined) {
    if (input.contacts && input.contacts.length > 0) {
      await setMetaValue(
        db,
        organizationMeta,
        organizationMeta.orgId,
        id,
        "contacts",
        JSON.stringify(input.contacts)
      );
    } else {
      await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "contacts");
    }
  }

  // Return updated organization
  return getOrganizationById(id);
}

/**
 * Delete an organization and all its metadata
 */
export async function deleteOrganization(id: number): Promise<boolean> {
  // Check if organization exists
  const existing = await getOrganizationById(id);
  if (!existing) return false;

  // Check if organization has associated jobs
  const jobCountResult = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.clientId, String(id)));

  if (jobCountResult[0]?.count > 0) {
    throw new Error(
      `Cannot delete organization with ${jobCountResult[0].count} associated jobs`
    );
  }

  // Delete all metadata
  await db.delete(organizationMeta).where(eq(organizationMeta.orgId, id));

  // Delete organization
  await db.delete(organization).where(eq(organization.id, id));

  return true;
}

/**
 * Get all organizations with metadata (for listing)
 */
export async function getAllOrganizations(): Promise<Organization[]> {
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

  // Build enriched organization list
  return orgRows.map((o) => {
    const meta = metaByOrg[o.id] || {};
    let contacts: number[] = [];
    try {
      contacts = JSON.parse(meta.contacts || "[]");
    } catch {
      /* ignore */
    }

    return {
      id: o.id,
      name: o.name,
      address: meta.address || null,
      streetAddress: meta.StreetAddress || null,
      city: meta.City || null,
      state: meta.State || null,
      zipCode: meta.ZipCode || null,
      logo: meta.logo || null,
      contacts,
      contactCount: contacts.length,
      jobCount: jobCountMap[String(o.id)] || 0,
    };
  });
}
