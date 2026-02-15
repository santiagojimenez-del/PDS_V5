import { db } from "@/lib/db";
import {
  recurringJobTemplates,
  recurringJobOccurrences,
  jobs,
  sites,
  organization,
} from "@/lib/db/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
import { generateOccurrences } from "./occurrence-generator";
import type {
  RecurringJobTemplate,
  RecurringJobOccurrence,
  ProcessTemplatesResult,
  TemplateWithDetails,
} from "../types";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
} from "../schemas/recurring-schemas";

/**
 * Get template by ID
 */
export async function getTemplateById(id: number): Promise<TemplateWithDetails | null> {
  const templates = await db
    .select()
    .from(recurringJobTemplates)
    .where(eq(recurringJobTemplates.id, id))
    .limit(1);

  if (!templates.length) return null;

  const template = templates[0];

  // Get site name
  const siteRows = await db
    .select({ name: sites.name })
    .from(sites)
    .where(eq(sites.id, template.siteId))
    .limit(1);

  // Get client name
  let clientName = `User #${template.clientId}`;
  if (template.clientType === "organization") {
    const orgRows = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, template.clientId))
      .limit(1);
    if (orgRows.length) clientName = orgRows[0].name;
  }

  // Get occurrence count
  const occCount = await db
    .select()
    .from(recurringJobOccurrences)
    .where(eq(recurringJobOccurrences.templateId, id));

  // Get next planned occurrence
  const nextOcc = await db
    .select()
    .from(recurringJobOccurrences)
    .where(
      and(
        eq(recurringJobOccurrences.templateId, id),
        eq(recurringJobOccurrences.status, "planned")
      )
    )
    .orderBy(recurringJobOccurrences.occurrenceAt)
    .limit(1);

  return {
    ...template,
    active: template.active === 1,
    isManual: template.isManual === 1,
    siteName: siteRows.length ? siteRows[0].name : undefined,
    clientName,
    occurrenceCount: occCount.length,
    nextOccurrence: nextOcc.length ? nextOcc[0].occurrenceAt : null,
  } as TemplateWithDetails;
}

/**
 * Create a new template
 */
export async function createTemplate(
  input: CreateTemplateInput,
  createdBy: number
): Promise<TemplateWithDetails> {
  const result = await db
    .insert(recurringJobTemplates)
    .values({
      name: input.name,
      siteId: input.siteId,
      clientType: input.clientType,
      clientId: input.clientId,
      rrule: input.rrule || null,
      timezone: input.timezone || "America/New_York",
      dtstart: input.dtstart ? new Date(input.dtstart) : null,
      dtend: input.dtend ? new Date(input.dtend) : null,
      windowDays: input.windowDays || 60,
      amountPayable: String(input.amountPayable || "0.00"),
      notes: input.notes || null,
      products: input.products,
      isManual: input.isManual ? 1 : 0,
      createdBy,
      active: 1,
    })
    .$returningId();

  const created = await getTemplateById(result[0].id);
  if (!created) {
    throw new Error("Failed to retrieve created template");
  }

  return created;
}

/**
 * Update a template
 */
export async function updateTemplate(
  id: number,
  input: UpdateTemplateInput
): Promise<TemplateWithDetails | null> {
  const existing = await getTemplateById(id);
  if (!existing) return null;

  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.active !== undefined) updateData.active = input.active ? 1 : 0;
  if (input.isManual !== undefined) updateData.isManual = input.isManual ? 1 : 0;
  if (input.siteId !== undefined) updateData.siteId = input.siteId;
  if (input.clientType !== undefined) updateData.clientType = input.clientType;
  if (input.clientId !== undefined) updateData.clientId = input.clientId;
  if (input.rrule !== undefined) updateData.rrule = input.rrule;
  if (input.timezone !== undefined) updateData.timezone = input.timezone;
  if (input.dtstart !== undefined) {
    updateData.dtstart = input.dtstart ? new Date(input.dtstart) : null;
  }
  if (input.dtend !== undefined) {
    updateData.dtend = input.dtend ? new Date(input.dtend) : null;
  }
  if (input.windowDays !== undefined) updateData.windowDays = input.windowDays;
  if (input.amountPayable !== undefined) updateData.amountPayable = String(input.amountPayable);
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.products !== undefined) updateData.products = input.products;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  await db
    .update(recurringJobTemplates)
    .set(updateData)
    .where(eq(recurringJobTemplates.id, id));

  return getTemplateById(id);
}

/**
 * Delete a template and its occurrences
 */
export async function deleteTemplate(id: number): Promise<boolean> {
  const existing = await getTemplateById(id);
  if (!existing) return false;

  // Check if any occurrences have been converted to jobs
  const withJobs = await db
    .select()
    .from(recurringJobOccurrences)
    .where(
      and(
        eq(recurringJobOccurrences.templateId, id),
        eq(recurringJobOccurrences.status, "created")
      )
    )
    .limit(1);

  if (withJobs.length > 0) {
    throw new Error(
      "Cannot delete template with created jobs. Set to inactive instead."
    );
  }

  // Delete all occurrences
  await db
    .delete(recurringJobOccurrences)
    .where(eq(recurringJobOccurrences.templateId, id));

  // Delete template
  await db
    .delete(recurringJobTemplates)
    .where(eq(recurringJobTemplates.id, id));

  return true;
}

/**
 * Create a Job from an occurrence
 */
export async function createJobFromOccurrence(
  occurrenceId: number
): Promise<number | null> {
  // Get occurrence
  const occurrences = await db
    .select()
    .from(recurringJobOccurrences)
    .where(eq(recurringJobOccurrences.id, occurrenceId))
    .limit(1);

  if (!occurrences.length) {
    throw new Error(`Occurrence ${occurrenceId} not found`);
  }

  const occurrence = occurrences[0];

  // Check if already created
  if (occurrence.status === "created" && occurrence.jobId) {
    return occurrence.jobId;
  }

  // Get template
  const template = await getTemplateById(occurrence.templateId);
  if (!template) {
    throw new Error(`Template ${occurrence.templateId} not found`);
  }

  // Create job
  const jobResult = await db
    .insert(jobs)
    .values({
      name: template.name,
      siteId: template.siteId,
      client: JSON.stringify({
        type: template.clientType,
        id: template.clientId,
      }),
      products: template.products,
      dates: JSON.stringify({}),
      pipeline: "bids",
      createdBy: template.createdBy,
      recurringOccurrenceId: occurrenceId,
    })
    .$returningId();

  const jobId = jobResult[0].id;

  // Set job metadata (amountPayable and notes stored in Job_Meta)
  const { setMetaValue } = await import("@/lib/db/helpers");
  const { jobMeta } = await import("@/lib/db/schema");

  await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "amount_payable", template.amountPayable);
  if (template.notes) {
    await setMetaValue(db, jobMeta, jobMeta.jobId, jobId, "notes", template.notes);
  }

  // Update occurrence
  await db
    .update(recurringJobOccurrences)
    .set({
      status: "created",
      jobId,
    })
    .where(eq(recurringJobOccurrences.id, occurrenceId));

  return jobId;
}

/**
 * Process all active templates (worker function)
 */
export async function processActiveTemplates(): Promise<ProcessTemplatesResult> {
  const now = new Date();
  const result: ProcessTemplatesResult = {
    processed: 0,
    totalOccurrences: 0,
    totalJobs: 0,
    errors: [],
  };

  // Get all active templates
  const activeTemplates = await db
    .select()
    .from(recurringJobTemplates)
    .where(eq(recurringJobTemplates.active, 1));

  for (const template of activeTemplates) {
    try {
      // Skip manual templates
      if (template.isManual === 1) {
        continue;
      }

      // Generate occurrences
      const genResult = await generateOccurrences(template.id);
      result.totalOccurrences += genResult.generated;

      // Get planned occurrences that should be created (occurrence date has passed)
      const dueOccurrences = await db
        .select()
        .from(recurringJobOccurrences)
        .where(
          and(
            eq(recurringJobOccurrences.templateId, template.id),
            eq(recurringJobOccurrences.status, "planned"),
            lt(recurringJobOccurrences.occurrenceAt, now)
          )
        );

      // Create jobs for due occurrences
      for (const occ of dueOccurrences) {
        try {
          await createJobFromOccurrence(occ.id);
          result.totalJobs++;
        } catch (error) {
          result.errors.push({
            templateId: template.id,
            error: `Failed to create job from occurrence ${occ.id}: ${
              error instanceof Error ? error.message : "unknown"
            }`,
          });
        }
      }

      result.processed++;
    } catch (error) {
      result.errors.push({
        templateId: template.id,
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  return result;
}
