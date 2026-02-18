"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconStar, IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import type { PilotSuggestion } from "../types";

interface PilotSuggestionListProps {
  scheduledDate: string;
  selectedPilots: number[];
  onTogglePilot: (pilotId: number) => void;
}

export function PilotSuggestionList({
  scheduledDate,
  selectedPilots,
  onTogglePilot,
}: PilotSuggestionListProps) {
  const [suggestions, setSuggestions] = useState<PilotSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scheduledDate) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/scheduling/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledDate, requiredCount: 3 }),
        });

        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.data.suggestions || []);
        }
      } catch (error) {
        console.error("Failed to fetch pilot suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [scheduledDate]);

  if (!scheduledDate) {
    return (
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>
          Select a date to see pilot availability and suggestions
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>
          No pilots available for this date. All pilots may be busy or unavailable.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Suggested Pilots (sorted by availability)
      </p>

      {suggestions.map((suggestion) => {
        const isSelected = selectedPilots.includes(suggestion.pilotId);
        const hasErrors = suggestion.conflicts.some((c) => c.severity === "error");
        const hasWarnings = suggestion.conflicts.some((c) => c.severity === "warning");

        return (
          <label
            key={suggestion.pilotId}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : hasErrors
                ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                : hasWarnings
                ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20"
                : "hover:bg-accent"
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onTogglePilot(suggestion.pilotId)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
              disabled={hasErrors}
            />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{suggestion.pilotName}</span>

                {/* Score badge */}
                <Badge
                  variant={
                    suggestion.score >= 80
                      ? "default"
                      : suggestion.score >= 50
                      ? "secondary"
                      : "destructive"
                  }
                  className="flex items-center gap-1"
                >
                  <IconStar className="h-3 w-3" />
                  {suggestion.score}
                </Badge>

                {/* Status indicator */}
                {hasErrors ? (
                  <IconX className="h-4 w-4 text-red-600" />
                ) : hasWarnings ? (
                  <IconAlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <IconCheck className="h-4 w-4 text-green-600" />
                )}
              </div>

              <p className="text-xs text-muted-foreground">{suggestion.pilotEmail}</p>

              {/* Reasons */}
              <div className="mt-1 flex flex-wrap gap-1">
                {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground">
                    {reason}
                  </span>
                ))}
              </div>

              {/* Conflicts */}
              {suggestion.conflicts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {suggestion.conflicts.slice(0, 2).map((conflict, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-1 text-xs ${
                        conflict.severity === "error"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      <IconAlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{conflict.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
