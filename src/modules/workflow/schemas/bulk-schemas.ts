import { z } from "zod";

export const bulkApproveSchema = z.object({
  jobIds: z.array(z.number()),
  approvedFlight: z.string(), // ISO date
});

export const bulkScheduleSchema = z.object({
  jobIds: z.array(z.number()),
  scheduledDate: z.string(), // ISO date
  scheduledFlight: z.string(), // ISO date
  personsAssigned: z.array(z.number()),
});

export const bulkFlightLogSchema = z.object({
  jobIds: z.array(z.number()),
  flownDate: z.string(), // ISO date
  flightLog: z.record(z.string(), z.unknown()).optional(),
});

export const bulkDeliverSchema = z.object({
  jobIds: z.array(z.number()),
  deliveredDate: z.string().optional(), // ISO date
});

export const bulkBillSchema = z.object({
  jobIds: z.array(z.number()),
  billedDate: z.string().optional(), // ISO date
  invoiceNumber: z.string(),
});

export const bulkDeleteSchema = z.object({
  jobIds: z.array(z.number()),
});

export const bulkGetJobsSchema = z.object({
  ids: z.string().transform((val) => val.split(",").map(Number)),
});
