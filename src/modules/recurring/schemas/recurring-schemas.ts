import { z } from "zod";

// ── Client Type Enum ────────────────────────────────────────────────────────

const clientTypeEnum = z.enum(["user", "organization"]);

// ── Create Template Schema ──────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255, "Name too long"),
  siteId: z.number().int().positive("Site ID must be a positive integer"),
  clientType: clientTypeEnum,
  clientId: z.number().int().positive("Client ID must be a positive integer"),
  rrule: z.string().nullable().default(null),
  timezone: z.string().max(50).default("America/New_York"),
  dtstart: z.union([z.date(), z.string().datetime()]).nullable().default(null),
  dtend: z.union([z.date(), z.string().datetime()]).nullable().default(null),
  windowDays: z.number().int().min(1).max(365).default(60),
  amountPayable: z.union([
    z.number().nonnegative(),
    z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format")
  ]).default("0.00"),
  notes: z.string().nullable().default(null),
  products: z.unknown(), // JSON field - validated separately
  isManual: z.boolean().default(false),
});

// ── Update Template Schema ──────────────────────────────────────────────────

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  active: z.boolean().optional(),
  isManual: z.boolean().optional(),
  siteId: z.number().int().positive().optional(),
  clientType: clientTypeEnum.optional(),
  clientId: z.number().int().positive().optional(),
  rrule: z.string().nullable().optional(),
  timezone: z.string().max(50).optional(),
  dtstart: z.union([z.date(), z.string().datetime()]).optional().nullable(),
  dtend: z.union([z.date(), z.string().datetime()]).optional().nullable(),
  windowDays: z.number().int().min(1).max(365).optional(),
  amountPayable: z.union([
    z.number().nonnegative(),
    z.string().regex(/^\d+(\.\d{1,2})?$/)
  ]).optional(),
  notes: z.string().optional(),
  products: z.unknown().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// ── Generate Occurrences Schema ─────────────────────────────────────────────

export const generateOccurrencesSchema = z.object({
  templateId: z.number().int().positive(),
  fromDate: z.union([z.date(), z.string().datetime()]).optional(),
  toDate: z.union([z.date(), z.string().datetime()]).optional(),
  maxCount: z.number().int().positive().max(1000).default(100),
});

// ── Create Job from Occurrence Schema ───────────────────────────────────────

export const createJobFromOccurrenceSchema = z.object({
  occurrenceId: z.number().int().positive(),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type GenerateOccurrencesInput = z.infer<typeof generateOccurrencesSchema>;
export type CreateJobFromOccurrenceInput = z.infer<typeof createJobFromOccurrenceSchema>;
