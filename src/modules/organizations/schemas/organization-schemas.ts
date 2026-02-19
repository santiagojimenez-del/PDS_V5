import { z } from "zod";

// ── Create Organization Schema ──────────────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255, "Name too long"),
  address: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "State should be 2-letter code").optional(),
  zipCode: z.string().max(10, "Zip code too long").optional(),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
});

// ── Update Organization Schema ──────────────────────────────────────────────

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255, "Name too long").optional(),
  address: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "State should be 2-letter code").optional(),
  zipCode: z.string().max(10, "Zip code too long").optional(),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// ── Organization Meta Schema ────────────────────────────────────────────────

export const organizationMetaSchema = z.object({
  metaKey: z.string().min(1, "Meta key is required").max(255, "Meta key too long"),
  metaValue: z.string(),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationMetaInput = z.infer<typeof organizationMetaSchema>;
