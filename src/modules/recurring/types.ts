// ── Recurring Job Types ─────────────────────────────────────────────────────

export type ClientType = "user" | "organization";

export type OccurrenceStatus = "planned" | "created" | "skipped" | "cancelled";

export interface RecurringJobTemplate {
  id: number;
  active: boolean;
  isManual: boolean;
  name: string;
  siteId: number;
  clientType: ClientType;
  clientId: number;
  rrule: string | null;
  timezone: string;
  dtstart: Date | null;
  dtend: Date | null;
  windowDays: number;
  lastGeneratedThrough: Date | null;
  amountPayable: string;
  notes: string | null;
  products: unknown;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringJobOccurrence {
  id: number;
  templateId: number;
  occurrenceAt: Date;
  status: OccurrenceStatus;
  jobId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringJobTemplateAttachment {
  id: number;
  templateId: number;
  name: string;
  path: string;
  type: string | null;
  size: number | null;
}

// CreateTemplateInput, UpdateTemplateInput, and GenerateOccurrencesInput
// are exported from schemas via z.infer to ensure type safety with validation

export interface GenerateOccurrencesResult {
  generated: number;
  skipped: number;
  occurrences: RecurringJobOccurrence[];
}

export interface ProcessTemplatesResult {
  processed: number;
  totalOccurrences: number;
  totalJobs: number;
  errors: Array<{ templateId: number; error: string }>;
}

export interface TemplateWithDetails extends RecurringJobTemplate {
  siteName?: string;
  clientName?: string;
  occurrenceCount?: number;
  nextOccurrence?: Date | null;
}
