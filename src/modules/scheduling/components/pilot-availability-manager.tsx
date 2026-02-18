"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { IconClock, IconCheck, IconX } from "@tabler/icons-react";

interface PilotAvailabilityManagerProps {
  pilotId: number;
  pilotName: string;
}

interface Availability {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

async function fetchAvailability(pilotId: number) {
  const res = await fetch(`/api/scheduling/pilots/${pilotId}/availability`);
  if (!res.ok) throw new Error("Failed to fetch availability");
  const json = await res.json();
  return json.data.availability as Availability[];
}

export function PilotAvailabilityManager({
  pilotId,
  pilotName,
}: PilotAvailabilityManagerProps) {
  const queryClient = useQueryClient();

  const { data: availability, isLoading } = useQuery({
    queryKey: ["pilot-availability", pilotId],
    queryFn: () => fetchAvailability(pilotId),
  });

  // Initialize weekly schedule (defaults if no data)
  const getDefaultSchedule = (): Record<number, Availability> => {
    const defaults: Record<number, Availability> = {};

    if (availability) {
      availability.forEach((avail) => {
        defaults[avail.dayOfWeek] = avail;
      });
    }

    // Fill in missing days with default unavailable
    DAYS_OF_WEEK.forEach((day) => {
      if (!defaults[day.value]) {
        defaults[day.value] = {
          dayOfWeek: day.value,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: false,
        };
      }
    });

    return defaults;
  };

  const [schedule, setSchedule] = useState<Record<number, Availability>>(getDefaultSchedule());

  // Update local state when data loads
  useState(() => {
    if (availability) {
      setSchedule(getDefaultSchedule());
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const availabilities = Object.values(schedule);
      const res = await fetch(`/api/scheduling/pilots/${pilotId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilities }),
      });
      if (!res.ok) throw new Error("Failed to save availability");
    },
    onSuccess: () => {
      toast.success("Availability saved successfully");
      queryClient.invalidateQueries({ queryKey: ["pilot-availability", pilotId] });
    },
    onError: () => {
      toast.error("Failed to save availability");
    },
  });

  const updateDay = (dayOfWeek: number, field: keyof Availability, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const toggleAvailability = (dayOfWeek: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        isAvailable: !prev[dayOfWeek].isAvailable,
      },
    }));
  };

  const applyToAll = () => {
    const monday = schedule[1];
    if (!monday) return;

    setSchedule((prev) => {
      const updated = { ...prev };
      [2, 3, 4, 5].forEach((day) => {
        // Tuesday through Friday
        updated[day] = {
          ...updated[day],
          startTime: monday.startTime,
          endTime: monday.endTime,
          isAvailable: monday.isAvailable,
        };
      });
      return updated;
    });
    toast.success("Applied Monday schedule to weekdays");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability - {pilotName}</CardTitle>
        <CardDescription>
          Set regular weekly availability hours. Days marked unavailable will not allow scheduling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick action */}
        <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
          <IconClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Quick apply:</span>
          <Button variant="outline" size="sm" onClick={applyToAll}>
            Copy Monday to Weekdays
          </Button>
        </div>

        {/* Weekly schedule */}
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = schedule[day.value];
            if (!daySchedule) return null;

            return (
              <div
                key={day.value}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
              >
                {/* Day name + Available toggle */}
                <div className="flex w-32 items-center gap-2">
                  <Checkbox
                    checked={daySchedule.isAvailable}
                    onCheckedChange={() => toggleAvailability(day.value)}
                  />
                  <span className="font-medium">{day.label}</span>
                </div>

                {/* Time inputs */}
                {daySchedule.isAvailable ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      type="time"
                      value={daySchedule.startTime}
                      onChange={(e) => updateDay(day.value, "startTime", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={daySchedule.endTime}
                      onChange={(e) => updateDay(day.value, "endTime", e.target.value)}
                      className="w-32"
                    />
                    <IconCheck className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
                    <IconX className="h-4 w-4 text-red-600" />
                    Unavailable
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
