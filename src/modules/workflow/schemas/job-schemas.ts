import { z } from "zod";

export const approveJobSchema = z.object({
  approvedFlight: z.string().min(1, "Approved flight date is required"),
});

export const scheduleJobSchema = z.object({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledFlight: z.string().min(1, "Scheduled flight is required"),
  personsAssigned: z.array(z.number().int().positive()).min(1, "At least one person must be assigned"),
});

export const logFlightSchema = z.object({
  flownDate: z.string().min(1, "Flown date is required"),
  flightLog: z.record(z.string(), z.unknown()).optional().default({}),
});

export const deliverJobSchema = z.object({
  deliveredDate: z.string().optional(),
});

export const billJobSchema = z.object({
  billedDate: z.string().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
});

export const billPaidSchema = z.object({
  billPaidDate: z.string().optional(),
  invoicePaid: z.string().optional(),
});

export const editJobSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  siteId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  clientType: z.enum(["organization", "user"]).optional(),
  products: z.array(z.number().int().positive()).optional(),
  notes: z.string().optional(),
  amountPayable: z.string().optional(),
});
