"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { IconCalendarOff, IconPlus, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";

interface PilotBlackoutManagerProps {
  pilotId: number;
  pilotName: string;
}

interface Blackout {
  id: number;
  pilotId: number;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
}

async function fetchBlackouts(pilotId: number) {
  const res = await fetch(`/api/scheduling/pilots/${pilotId}/blackout?future=true`);
  if (!res.ok) throw new Error("Failed to fetch blackouts");
  const json = await res.json();
  return json.data.blackouts as Blackout[];
}

export function PilotBlackoutManager({
  pilotId,
  pilotName,
}: PilotBlackoutManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: blackouts, isLoading } = useQuery({
    queryKey: ["pilot-blackouts", pilotId],
    queryFn: () => fetchBlackouts(pilotId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/scheduling/pilots/${pilotId}/blackout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) throw new Error("Failed to create blackout");
    },
    onSuccess: () => {
      toast.success("Blackout period added");
      queryClient.invalidateQueries({ queryKey: ["pilot-blackouts", pilotId] });
      setShowForm(false);
      setStartDate("");
      setEndDate("");
      setReason("");
    },
    onError: () => {
      toast.error("Failed to add blackout period");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (blackoutId: number) => {
      const res = await fetch(`/api/scheduling/pilots/${pilotId}/blackout/${blackoutId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete blackout");
    },
    onSuccess: () => {
      toast.success("Blackout period removed");
      queryClient.invalidateQueries({ queryKey: ["pilot-blackouts", pilotId] });
    },
    onError: () => {
      toast.error("Failed to remove blackout period");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blackout Dates - {pilotName}</CardTitle>
            <CardDescription>
              Mark dates when pilot is unavailable (vacation, PTO, etc.)
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Blackout
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add blackout form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                placeholder="e.g., Vacation, Medical leave, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setStartDate("");
                  setEndDate("");
                  setReason("");
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Blackout"}
              </Button>
            </div>
          </form>
        )}

        {/* Blackout list */}
        {blackouts && blackouts.length > 0 ? (
          <div className="space-y-2">
            {blackouts.map((blackout) => (
              <div
                key={blackout.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
              >
                <div className="flex items-start gap-3">
                  <IconCalendarOff className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(blackout.startDate), "MMM dd, yyyy")} -{" "}
                      {format(new Date(blackout.endDate), "MMM dd, yyyy")}
                    </p>
                    {blackout.reason && (
                      <p className="text-sm text-muted-foreground">{blackout.reason}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(blackout.id)}
                  disabled={deleteMutation.isPending}
                >
                  <IconTrash className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          !showForm && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No blackout periods set. Pilot is available according to weekly schedule.
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
