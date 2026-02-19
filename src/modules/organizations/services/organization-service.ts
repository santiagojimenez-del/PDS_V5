import { db } from "@/lib/db";
import { organization, organizationMeta, jobs, users, userMeta } from "@/lib/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { setMetaValue, getMetaMap, deleteMetaValue } from "@/lib/db/helpers";
import type { Organization, OrgContact } from "../types";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "../schemas/organization-schemas";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse the contacts JSON value stored in Organization_Meta.
 * Supports both legacy `number[]` format and current `{user_id, primary}[]` format.
 */
function parseContacts(raw: string | undefined): OrgContact[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Legacy format: number[]
    if (parsed.length > 0 && typeof parsed[0] === "number") {
      return parsed.map((id: number) => ({ user_id: id, primary: false }));
    }

    // Current format: {user_id, primary}[]
    return parsed.filter(
      (c: unknown) =>
        c !== null &&
        typeof c === "object" &&
        typeof (c as OrgContact).user_id === "number"
    ) as OrgContact[];
  } catch {
    return [];
  }
}

async function saveContacts(orgId: number, contacts: OrgContact[]): Promise<void> {
  if (contacts.length === 0) {
    await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, orgId, "contacts");
  } else {
    await setMetaValue(
      db,
      organizationMeta,
      organizationMeta.orgId,
      orgId,
      "contacts",
      JSON.stringify(contacts)
    );
  }
}

// ── Fetch user details for contacts ──────────────────────────────────────────

export interface ContactWithUser extends OrgContact {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export async function enrichContacts(contacts: OrgContact[]): Promise<ContactWithUser[]> {
  if (!contacts.length) return [];

  const userIds = contacts.map((c) => c.user_id);

  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.id, userIds));

  const metaRows = await db
    .select({ uid: userMeta.uid, metaKey: userMeta.metaKey, metaValue: userMeta.metaValue })
    .from(userMeta)
    .where(inArray(userMeta.uid, userIds));

  const metaByUser: Record<number, Record<string, string>> = {};
  for (const m of metaRows) {
    if (!metaByUser[m.uid]) metaByUser[m.uid] = {};
    if (m.metaValue) metaByUser[m.uid][m.metaKey] = m.metaValue;
  }

  const userMap: Record<number, { email: string; firstName: string; lastName: string }> = {};
  for (const u of userRows) {
    const meta = metaByUser[u.id] || {};
    userMap[u.id] = {
      email: u.email,
      firstName: meta.first_name || "",
      lastName: meta.last_name || "",
    };
  }

  return contacts.map((c) => {
    const u = userMap[c.user_id];
    const firstName = u?.firstName || "";
    const lastName = u?.lastName || "";
    return {
      ...c,
      email: u?.email || "",
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(" ") || u?.email || `User #${c.user_id}`,
    };
  });
}

// ── Get organization by ID ────────────────────────────────────────────────────

export async function getOrganizationById(id: number): Promise<Organization | null> {
  const orgRows = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);

  if (!orgRows.length) return null;

  const org = orgRows[0];
  const meta = await getMetaMap(db, organizationMeta, organizationMeta.orgId, id);

  const contacts = parseContacts(meta.contacts);

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
    archived: meta.archived === "1" || meta.archived === "true",
  };
}

// ── Create organization ───────────────────────────────────────────────────────

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const insertResult = await db
    .insert(organization)
    .values({ name: input.name })
    .$returningId();

  const orgId = insertResult[0].id;

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

  const created = await getOrganizationById(orgId);
  if (!created) throw new Error("Failed to retrieve created organization");

  return created;
}

// ── Update organization ───────────────────────────────────────────────────────

export async function updateOrganization(
  id: number,
  input: UpdateOrganizationInput
): Promise<Organization | null> {
  const existing = await getOrganizationById(id);
  if (!existing) return null;

  if (input.name !== undefined) {
    await db.update(organization).set({ name: input.name }).where(eq(organization.id, id));
  }

  const metaFields: [string, string | undefined | null][] = [
    ["address",       input.address],
    ["StreetAddress", input.streetAddress],
    ["City",          input.city],
    ["State",         input.state],
    ["ZipCode",       input.zipCode],
    ["logo",          input.logo],
  ];

  for (const [key, value] of metaFields) {
    if (value !== undefined) {
      if (value) {
        await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, key, value);
      } else {
        await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, key);
      }
    }
  }

  return getOrganizationById(id);
}

// ── Delete organization ───────────────────────────────────────────────────────

export async function deleteOrganization(id: number): Promise<boolean> {
  const existing = await getOrganizationById(id);
  if (!existing) return false;

  const jobCountResult = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.clientId, String(id)));

  if (jobCountResult[0]?.count > 0) {
    throw new Error(
      `Cannot delete organization with ${jobCountResult[0].count} associated jobs`
    );
  }

  await db.delete(organizationMeta).where(eq(organizationMeta.orgId, id));
  await db.delete(organization).where(eq(organization.id, id));

  return true;
}

// ── Archive / Unarchive ───────────────────────────────────────────────────────

export async function archiveOrganization(id: number): Promise<boolean> {
  const existing = await getOrganizationById(id);
  if (!existing) return false;
  await setMetaValue(db, organizationMeta, organizationMeta.orgId, id, "archived", "1");
  return true;
}

export async function unarchiveOrganization(id: number): Promise<boolean> {
  const existing = await getOrganizationById(id);
  if (!existing) return false;
  await deleteMetaValue(db, organizationMeta, organizationMeta.orgId, id, "archived");
  return true;
}

// ── Contact management ────────────────────────────────────────────────────────

export async function addOrgContact(orgId: number, userId: number): Promise<OrgContact[]> {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error("Organization not found");

  const contacts = org.contacts || [];
  if (contacts.some((c) => c.user_id === userId)) {
    throw new Error("User is already a contact of this organization");
  }

  // First contact becomes primary automatically
  const isPrimary = contacts.length === 0;
  const updated = [...contacts, { user_id: userId, primary: isPrimary }];
  await saveContacts(orgId, updated);
  return updated;
}

export async function removeOrgContact(orgId: number, userId: number): Promise<OrgContact[]> {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error("Organization not found");

  const contacts = org.contacts || [];
  const existing = contacts.find((c) => c.user_id === userId);
  if (!existing) throw new Error("User is not a contact of this organization");

  let updated = contacts.filter((c) => c.user_id !== userId);

  // If the removed contact was primary, assign primary to the first remaining contact
  if (existing.primary && updated.length > 0) {
    updated[0] = { ...updated[0], primary: true };
  }

  await saveContacts(orgId, updated);
  return updated;
}

export async function makePrimaryOrgContact(orgId: number, userId: number): Promise<OrgContact[]> {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error("Organization not found");

  const contacts = org.contacts || [];
  if (!contacts.some((c) => c.user_id === userId)) {
    throw new Error("User is not a contact of this organization");
  }

  const updated = contacts.map((c) => ({ ...c, primary: c.user_id === userId }));
  await saveContacts(orgId, updated);
  return updated;
}

// ── Get all organizations ─────────────────────────────────────────────────────

export async function getAllOrganizations(): Promise<Organization[]> {
  const orgRows = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .orderBy(organization.name);

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

  const jobCounts = await db
    .select({ clientId: jobs.clientId, count: count() })
    .from(jobs)
    .where(eq(jobs.clientType, "organization"))
    .groupBy(jobs.clientId);

  const jobCountMap: Record<string, number> = {};
  for (const jc of jobCounts) {
    if (jc.clientId) jobCountMap[jc.clientId] = jc.count;
  }

  return orgRows.map((o) => {
    const meta = metaByOrg[o.id] || {};
    const contacts = parseContacts(meta.contacts);

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
      archived: meta.archived === "1" || meta.archived === "true",
    };
  });
}
