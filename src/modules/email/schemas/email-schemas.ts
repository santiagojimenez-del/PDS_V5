import { z } from "zod";

// ── Email Validation Schemas ─────────────────────────────────────────────────

export const emailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const sendEmailSchema = z.object({
  to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
  from: emailAddressSchema.optional(),
  replyTo: emailAddressSchema.optional(),
  subject: z.string().min(1).max(500),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
  bcc: z.union([emailAddressSchema, z.array(emailAddressSchema)]).optional(),
});

// ── Template Email Schemas ───────────────────────────────────────────────────

export const send2FACodeSchema = z.object({
  to: emailAddressSchema,
  data: z.object({
    code: z.string().length(6),
    userName: z.string(),
    expiresInMinutes: z.number().positive().default(10),
  }),
});

export const sendResetPasswordSchema = z.object({
  to: emailAddressSchema,
  data: z.object({
    userName: z.string(),
    resetLink: z.string().url(),
    expiresInHours: z.number().positive().default(24),
  }),
});

export const sendSignupConfirmationSchema = z.object({
  to: emailAddressSchema,
  data: z.object({
    userName: z.string(),
    confirmationLink: z.string().url(),
  }),
});

export const sendPilotNotificationSchema = z.object({
  to: emailAddressSchema,
  data: z.object({
    pilotName: z.string(),
    jobId: z.number().int().positive(),
    jobTitle: z.string(),
    clientName: z.string(),
    scheduledDate: z.string().optional(),
    action: z.enum(["assigned", "scheduled", "rescheduled", "cancelled"]),
  }),
});

export const sendDeliveryNotificationSchema = z.object({
  to: emailAddressSchema,
  data: z.object({
    clientName: z.string(),
    jobId: z.number().int().positive(),
    jobTitle: z.string(),
    deliveryDate: z.string(),
    downloadLink: z.string().url().optional(),
  }),
});

export const sendJobStatusUpdateSchema = z.object({
  to: emailAddressSchema,
  data: z.object({
    recipientName: z.string(),
    jobId: z.number().int().positive(),
    jobTitle: z.string(),
    oldStatus: z.string(),
    newStatus: z.string(),
    message: z.string().optional(),
  }),
});
