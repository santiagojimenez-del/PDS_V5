// ── Organization Types ──────────────────────────────────────────────────────

export interface OrgContact {
  user_id: number;
  primary: boolean;
}

export interface Organization {
  id: number;
  name: string;
  address?: string | null;
  logo?: string | null;
  contactCount?: number;
  jobCount?: number;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  contacts?: OrgContact[];
  archived?: boolean;
}

export interface OrganizationMeta {
  orgId: number;
  metaKey: string;
  metaValue: string;
}

// CreateOrganizationInput and UpdateOrganizationInput are exported from schemas
// via z.infer to ensure type safety with validation

export interface OrganizationWithMeta extends Organization {
  meta: Record<string, string>;
}
