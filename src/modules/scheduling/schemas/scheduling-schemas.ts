import { z } from "zod";

/**
 * Pilot Scheduling Module - Zod Validation Schemas
 */

// Time format validation (HH:MM)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Invalid time format. Use HH:MM (e.g., 09:00)"),
  endTime: z.string().regex(timeRegex, "Invalid time format. Use HH:MM (e.g., 17:00)"),
  isAvailable: z.boolean().default(true),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Ensure startTime is before endTime
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return startMinutes < endMinutes;
  },
  {
    message: "Start time must be before end time",
  }
);

export const blackoutSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
}).refine(
  (data) => {
    // Ensure startDate is before or equal to endDate
    return new Date(data.startDate) <= new Date(data.endDate);
  },
  {
    message: "Start date must be before or equal to end date",
  }
);

export const conflictCheckSchema = z.object({
  pilotId: z.number().int().positive(),
  scheduledDate: z.string().min(1),
  durationHours: z.number().min(0.5).max(24).optional().default(4), // Default 4 hours
});

export const assignmentSuggestionSchema = z.object({
  jobId: z.number().int().positive(),
  requiredCount: z.number().int().min(1).max(10).optional().default(1),
  preferredDate: z.string().optional(),
});

export const bulkAvailabilitySchema = z.object({
  availabilities: z.array(availabilitySchema).min(1).max(7), // Max 7 days per week
});

export const pilotPreferencesSchema = z.object({
  maxJobsPerWeek: z.number().int().min(1).max(50).optional(),
  maxJobsPerMonth: z.number().int().min(1).max(200).optional(),
  skills: z.array(z.string()).optional(),
  timezone: z.string().optional(),
});
