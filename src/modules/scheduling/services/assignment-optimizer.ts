import { db } from "@/lib/db";
import { users, userMeta } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { detectScheduleConflicts, getPilotAssignments } from "./conflict-detector";
import type { PilotSuggestion } from "../types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

/**
 * Suggest optimal pilots for a job based on multiple factors
 */
export async function suggestOptimalPilots(
  scheduledDate: string, // YYYY-MM-DD format
  requiredCount: number = 1,
  durationHours: number = 4
): Promise<PilotSuggestion[]> {
  // 1. Get all pilots and staff
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users);

  // Get roles from userMeta
  const allUserIds = allUsers.map((u) => u.id);
  const metaData = await db
    .select({
      uid: userMeta.uid,
      metaKey: userMeta.metaKey,
      metaValue: userMeta.metaValue,
    })
    .from(userMeta)
    .where(inArray(userMeta.uid, allUserIds));

  // Build user map with roles
  const userMap = new Map<number, { name: string; email: string; roles: string[] }>();

  for (const user of allUsers) {
    const roles: string[] = [];
    const roleMeta = metaData.find(
      (m) => m.uid === user.id && m.metaKey === "roles"
    );

    if (roleMeta && roleMeta.metaValue) {
      try {
        const parsed = JSON.parse(roleMeta.metaValue);
        if (Array.isArray(parsed)) {
          roles.push(...parsed);
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    userMap.set(user.id, {
      name: user.name || user.email,
      email: user.email,
      roles,
    });
  }

  // Filter for pilots and staff only
  const pilots = Array.from(userMap.entries())
    .filter(([_, data]) => data.roles.includes("Pilot") || data.roles.includes("Staff"))
    .map(([id, data]) => ({ id, ...data }));

  if (pilots.length === 0) {
    return [];
  }

  // 2. Score each pilot
  const suggestions: PilotSuggestion[] = [];
  const date = parseISO(scheduledDate);
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  for (const pilot of pilots) {
    let score = 100; // Start with perfect score
    const reasons: string[] = [];

    // Check for conflicts
    const conflictReport = await detectScheduleConflicts(
      pilot.id,
      scheduledDate,
      durationHours
    );

    // Deduct points for conflicts
    if (conflictReport.hasConflicts) {
      for (const conflict of conflictReport.conflicts) {
        if (conflict.severity === "error") {
          score -= 50; // Major penalty for hard conflicts
          reasons.push(`⚠️ ${conflict.message}`);
        } else {
          score -= 20; // Minor penalty for warnings
          reasons.push(`⚡ ${conflict.message}`);
        }
      }
    } else {
      reasons.push("✅ No conflicts detected");
    }

    // Get workload for this week
    const weekAssignments = await getPilotAssignments(pilot.id, weekStart, weekEnd);
    const weekJobCount = weekAssignments.length;

    if (weekJobCount === 0) {
      score += 10; // Bonus for being available all week
      reasons.push("💡 Available all week");
    } else if (weekJobCount <= 2) {
      score += 5; // Small bonus for light load
      reasons.push(`📅 ${weekJobCount} job(s) this week`);
    } else {
      score -= 10; // Penalty for heavy load
      reasons.push(`⏰ Busy week (${weekJobCount} jobs)`);
    }

    // Get workload for this month
    const monthAssignments = await getPilotAssignments(pilot.id, monthStart, monthEnd);
    const monthJobCount = monthAssignments.length;

    if (monthJobCount <= 5) {
      score += 5; // Bonus for light monthly load
      reasons.push(`📊 ${monthJobCount} job(s) this month`);
    } else if (monthJobCount > 10) {
      score -= 5; // Penalty for very busy month
      reasons.push(`📈 Very busy month (${monthJobCount} jobs)`);
    }

    // Ensure score is within 0-100 range
    score = Math.max(0, Math.min(100, score));

    suggestions.push({
      pilotId: pilot.id,
      pilotName: pilot.name,
      pilotEmail: pilot.email,
      score,
      reasons,
      conflicts: conflictReport.conflicts,
    });
  }

  // Sort by score (highest first) and return top results
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.slice(0, Math.max(requiredCount * 2, 5)); // Return at least 5 suggestions
}

/**
 * Check if a specific pilot can be assigned to a job
 */
export async function canAssignPilot(
  pilotId: number,
  scheduledDate: string,
  durationHours: number = 4
): Promise<{ canAssign: boolean; reason: string }> {
  const conflictReport = await detectScheduleConflicts(
    pilotId,
    scheduledDate,
    durationHours
  );

  if (!conflictReport.canSchedule) {
    const errorConflicts = conflictReport.conflicts.filter((c) => c.severity === "error");
    return {
      canAssign: false,
      reason: errorConflicts[0]?.message || "Cannot assign due to conflicts",
    };
  }

  return {
    canAssign: true,
    reason: "Pilot is available",
  };
}

/**
 * Get workload summary for a pilot
 */
export async function getPilotWorkload(
  pilotId: number,
  startDate: Date,
  endDate: Date
): Promise<{
  totalJobs: number;
  assignments: any[];
  avgJobsPerWeek: number;
}> {
  const assignments = await getPilotAssignments(pilotId, startDate, endDate);
  const totalJobs = assignments.length;

  // Calculate average jobs per week
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weeks = Math.max(1, daysDiff / 7);
  const avgJobsPerWeek = totalJobs / weeks;

  return {
    totalJobs,
    assignments,
    avgJobsPerWeek: Math.round(avgJobsPerWeek * 10) / 10, // Round to 1 decimal
  };
}
