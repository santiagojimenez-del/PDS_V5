"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { type JobData } from "./job-card";
import { PIPELINES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface JobsResponse {
  jobs: JobData[];
  counts: Record<string, number>;
}

const PIPELINE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  [PIPELINES.BIDS]: {
    label: "Bid",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    dot: "bg-yellow-500",
  },
  [PIPELINES.SCHEDULED]: {
    label: "Scheduled",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  [PIPELINES.PROCESSING_DELIVER]: {
    label: "Processing",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  [PIPELINES.BILL]: {
    label: "Bill",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  [PIPELINES.COMPLETED]: {
    label: "Completed",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    dot: "bg-green-500",
  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Normalizes any date string to "YYYY-MM-DD" (handles full ISO and plain date) */
function toDateStr(raw: string): string {
  return raw.slice(0, 10);
}

/** Returns the relevant date string for a job based on its pipeline */
function getJobDate(dates: Record<string, string>, pipeline: string): string | null {
  const map: Record<string, string[]> = {
    bids: ["created", "requested"],
    scheduled: ["scheduled", "created", "requested"],
    "processing-deliver": ["flown", "scheduled", "delivered"],
    bill: ["billed", "delivered"],
    completed: ["billed", "delivered", "flown"],
  };
  const keys = map[pipeline] || ["created", "requested"];
  for (const k of keys) {
    if (dates[k]) return toDateStr(dates[k]);
  }
  return null;
}

async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch("/api/workflow/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const json = await res.json();
  return json.data;
}

/** Builds a calendar grid for the given year/month.
 *  Returns an array of 35 or 42 date cells (always fills to complete weeks).
 *  Cells outside the current month have `isCurrentMonth = false`.
 */
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: {
    date: Date;
    dayNum: number;
    isCurrentMonth: boolean;
    dateStr: string; // "YYYY-MM-DD"
  }[] = [];

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({
      date: d,
      dayNum: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateStr: d.toISOString().slice(0, 10),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({
      date,
      dayNum: d,
      isCurrentMonth: true,
      dateStr: date.toISOString().slice(0, 10),
    });
  }

  // Trailing days from next month
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      cells.push({
        date,
        dayNum: d,
        isCurrentMonth: false,
        dateStr: date.toISOString().slice(0, 10),
      });
    }
  }

  return cells;
}

const MAX_VISIBLE_JOBS = 3;

export function CalendarView() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-jobs"],
    queryFn: fetchJobs,
    refetchInterval: 30000,
  });

  const todayStr = today.toISOString().slice(0, 10);

  // Map dateStr → jobs[]
  const jobsByDate = useMemo(() => {
    const map = new Map<string, JobData[]>();
    for (const job of data?.jobs || []) {
      const dateStr = getJobDate(job.dates, job.pipeline);
      if (!dateStr) continue;
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(job);
    }
    return map;
  }, [data?.jobs]);

  const calendarCells = useMemo(
    () => buildCalendarGrid(year, month),
    [year, month]
  );

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Total jobs in visible month
  const monthJobCount = useMemo(() => {
    let count = 0;
    for (const cell of calendarCells) {
      if (cell.isCurrentMonth) {
        count += jobsByDate.get(cell.dateStr)?.length || 0;
      }
    }
    return count;
  }, [calendarCells, jobsByDate]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-[580px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load jobs. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h3>
          <span className="text-sm text-muted-foreground">
            {monthJobCount} job{monthJobCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevMonth}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextMonth}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {calendarCells.map((cell, idx) => {
            const cellJobs = jobsByDate.get(cell.dateStr) || [];
            const isToday = cell.dateStr === todayStr;
            const visibleJobs = cellJobs.slice(0, MAX_VISIBLE_JOBS);
            const overflowCount = cellJobs.length - MAX_VISIBLE_JOBS;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[110px] p-1.5",
                  !cell.isCurrentMonth && "bg-muted/20",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Day number */}
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : cell.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    )}
                  >
                    {cell.dayNum}
                  </span>
                </div>

                {/* Job pills */}
                <div className="space-y-0.5">
                  {visibleJobs.map((job) => {
                    const cfg =
                      PIPELINE_CONFIG[job.pipeline] ||
                      PIPELINE_CONFIG[PIPELINES.BIDS];
                    return (
                      <button
                        key={job.id}
                        onClick={() =>
                          router.push(`/workflow/jobs/${job.id}`)
                        }
                        title={`#${job.id} · ${job.siteName} · ${job.clientName}`}
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left transition-opacity hover:opacity-80",
                          cfg.bg,
                          cfg.text
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            cfg.dot
                          )}
                        />
                        <span className="truncate text-[11px] font-medium leading-tight">
                          #{job.id} {job.siteName}
                        </span>
                      </button>
                    );
                  })}
                  {overflowCount > 0 && (
                    <p className="pl-1 text-[10px] text-muted-foreground">
                      +{overflowCount} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PIPELINE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <IconCalendarEvent className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Date shown: relevant date per stage
          </span>
        </div>
      </div>
    </div>
  );
}
