import { RRule, rrulestr } from "rrule";
import { db } from "@/lib/db";
import { recurringJobTemplates, recurringJobOccurrences } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import type { RecurringJobTemplate, RecurringJobOccurrence, GenerateOccurrencesResult } from "../types";

/**
 * Generate occurrences for a recurring job template using RRULE
 */
export async function generateOccurrences(
  templateId: number,
  fromDate?: Date,
  toDate?: Date,
  maxCount: number = 100
): Promise<GenerateOccurrencesResult> {
  // Get template
  const templates = await db
    .select()
    .from(recurringJobTemplates)
    .where(eq(recurringJobTemplates.id, templateId))
    .limit(1);

  if (!templates.length) {
    throw new Error(`Template ${templateId} not found`);
  }

  const template = templates[0];

  // Manual template: create a single occurrence on demand (no RRULE needed)
  if (template.isManual === 1) {
    const occurrenceDate = fromDate || new Date();

    const insertResult = await db
      .insert(recurringJobOccurrences)
      .values({
        templateId,
        occurrenceAt: occurrenceDate,
        status: "planned",
        jobId: null,
      })
      .$returningId();

    const created = await db
      .select()
      .from(recurringJobOccurrences)
      .where(eq(recurringJobOccurrences.id, insertResult[0].id))
      .limit(1);

    return {
      generated: created.length,
      skipped: 0,
      occurrences: created as RecurringJobOccurrence[],
    };
  }

  // Template without RRULE (guard for non-manual edge case)
  if (!template.rrule) {
    return { generated: 0, skipped: 0, occurrences: [] };
  }

  // Calculate date range
  const now = new Date();
  const start = fromDate || template.lastGeneratedThrough || template.dtstart || now;
  const end = toDate || new Date(now.getTime() + template.windowDays * 24 * 60 * 60 * 1000);

  // Respect dtend if set
  let effectiveEnd = end;
  if (template.dtend && template.dtend < end) {
    effectiveEnd = template.dtend;
  }

  // Parse RRULE
  let rrule: RRule;
  try {
    rrule = rrulestr(template.rrule, {
      dtstart: template.dtstart || undefined,
      tzid: template.timezone,
    }) as RRule;
  } catch (error) {
    throw new Error(`Invalid RRULE: ${error instanceof Error ? error.message : "unknown"}`);
  }

  // Generate dates
  const dates = rrule.between(start, effectiveEnd, true);

  // Limit to maxCount
  const limitedDates = dates.slice(0, maxCount);

  // Get existing occurrences to avoid duplicates
  const existing = await db
    .select({ occurrenceAt: recurringJobOccurrences.occurrenceAt })
    .from(recurringJobOccurrences)
    .where(
      and(
        eq(recurringJobOccurrences.templateId, templateId),
        gte(recurringJobOccurrences.occurrenceAt, start),
        lte(recurringJobOccurrences.occurrenceAt, effectiveEnd)
      )
    );

  const existingDatesSet = new Set(
    existing.map((e) => e.occurrenceAt.toISOString())
  );

  // Filter out existing dates
  const newDates = limitedDates.filter(
    (date) => !existingDatesSet.has(date.toISOString())
  );

  // Create new occurrences
  const createdOccurrences: RecurringJobOccurrence[] = [];
  let skipped = 0;

  for (const date of newDates) {
    try {
      const result = await db
        .insert(recurringJobOccurrences)
        .values({
          templateId,
          occurrenceAt: date,
          status: "planned",
          jobId: null,
        })
        .$returningId();

      // Fetch created occurrence
      const created = await db
        .select()
        .from(recurringJobOccurrences)
        .where(eq(recurringJobOccurrences.id, result[0].id))
        .limit(1);

      if (created.length) {
        createdOccurrences.push(created[0] as RecurringJobOccurrence);
      }
    } catch (error) {
      // Unique constraint violation - already exists
      skipped++;
    }
  }

  // Update lastGeneratedThrough if we generated any
  if (createdOccurrences.length > 0 || limitedDates.length > 0) {
    const lastDate = limitedDates[limitedDates.length - 1] || effectiveEnd;
    await db
      .update(recurringJobTemplates)
      .set({ lastGeneratedThrough: lastDate })
      .where(eq(recurringJobTemplates.id, templateId));
  }

  return {
    generated: createdOccurrences.length,
    skipped: skipped + (dates.length - limitedDates.length),
    occurrences: createdOccurrences,
  };
}

/**
 * Get next N occurrences for a template (preview without creating)
 */
export function previewOccurrences(
  rruleString: string,
  timezone: string,
  dtstart: Date | null,
  count: number = 10
): Date[] {
  if (!rruleString) {
    return [];
  }

  try {
    const rrule = rrulestr(rruleString, {
      dtstart: dtstart || undefined,
      tzid: timezone,
    }) as RRule;

    const now = new Date();
    return rrule.all((date, i) => {
      if (i >= count) return false;
      return date >= now;
    });
  } catch (error) {
    console.error("Error previewing occurrences:", error);
    return [];
  }
}

/**
 * Validate RRULE string
 */
export function validateRRule(rruleString: string): { valid: boolean; error?: string } {
  try {
    rrulestr(rruleString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid RRULE",
    };
  }
}
