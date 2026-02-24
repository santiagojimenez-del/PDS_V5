"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCalendar, IconUser } from "@tabler/icons-react";
import { format, startOfWeek, addDays, parseISO } from "date-fns";

interface PilotScheduleCalendarProps {
  pilotId: number;
  weekStart?: Date;
}

interface Assignment {
  jobId: number;
  jobName: string;
  scheduledDate: string;
}

async function fetchPilotWeeklySchedule(pilotId: number, weekStartDate: Date) {
  const weekStartStr = weekStartDate.toISOString().split("T")[0];
  const res = await fetch(
    `/api/scheduling/pilots/${pilotId}/calendar?weekStart=${weekStartStr}`
  );
  if (!res.ok) return [] as Assignment[];
  const json = await res.json();
  return (json.data?.assignments || []) as Assignment[];
}

export function PilotScheduleCalendar({
  pilotId,
  weekStart = startOfWeek(new Date()),
}: PilotScheduleCalendarProps) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["pilot-schedule", pilotId, weekStart.toISOString()],
    queryFn: () => fetchPilotWeeklySchedule(pilotId, weekStart),
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group assignments by date
  const assignmentsByDate: Record<string, Assignment[]> = {};
  (assignments || []).forEach((assignment) => {
    const dateKey = assignment.scheduledDate;
    if (!assignmentsByDate[dateKey]) {
      assignmentsByDate[dateKey] = [];
    }
    assignmentsByDate[dateKey].push(assignment);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
        <CardDescription>
          {format(weekStart, "MMM dd")} - {format(addDays(weekStart, 6), "MMM dd, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAssignments = assignmentsByDate[dateKey] || [];
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div
                key={dateKey}
                className={`rounded-lg border p-2 ${
                  isToday ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="mb-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isToday ? "text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>

                {dayAssignments.length > 0 ? (
                  <div className="space-y-1">
                    {dayAssignments.map((assignment) => (
                      <Badge
                        key={assignment.jobId}
                        variant="secondary"
                        className="w-full truncate text-[10px] px-1 py-0.5"
                      >
                        #{assignment.jobId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Free
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconCalendar className="h-4 w-4" />
            <span>{assignments?.length || 0} job(s) this week</span>
          </div>
          {(assignments?.length || 0) > 0 && (
            <Badge variant="outline">
              Avg: {((assignments?.length || 0) / 7).toFixed(1)} jobs/day
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
