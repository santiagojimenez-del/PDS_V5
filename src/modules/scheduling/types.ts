/**
 * Pilot Scheduling Module - TypeScript Types
 */

export interface PilotAvailability {
  id: number;
  pilotId: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PilotBlackout {
  id: number;
  pilotId: number;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
}

export interface PilotProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  availability: PilotAvailability[];
  blackouts: PilotBlackout[];
  maxJobsPerWeek?: number;
  maxJobsPerMonth?: number;
  skills?: string[];
  timezone?: string;
}

export interface JobAssignment {
  jobId: number;
  jobName: string;
  scheduledDate: string;
  scheduledFlight: string;
  siteName: string;
  clientName: string;
  products: { id: number; name: string }[];
}

export interface ConflictType {
  type: "double_booking" | "blackout" | "unavailable" | "job_limit_exceeded" | "outside_hours";
  severity: "error" | "warning";
  message: string;
  details?: any;
}

export interface ConflictReport {
  hasConflicts: boolean;
  conflicts: ConflictType[];
  canSchedule: boolean; // false if any error-level conflicts
}

export interface PilotSuggestion {
  pilotId: number;
  pilotName: string;
  pilotEmail: string;
  score: number; // 0-100, higher is better
  reasons: string[]; // why this pilot is suggested
  conflicts: ConflictType[];
}

export interface ScheduleOverview {
  pilotId: number;
  pilotName: string;
  assignments: JobAssignment[];
  totalJobsThisWeek: number;
  totalJobsThisMonth: number;
  nextAvailableSlot: Date | null;
}

export interface CalendarDay {
  date: Date;
  isAvailable: boolean;
  isBlackout: boolean;
  assignments: JobAssignment[];
  conflicts: ConflictType[];
}

export interface WeeklySchedule {
  pilotId: number;
  pilotName: string;
  weekStart: Date;
  weekEnd: Date;
  days: CalendarDay[];
}
