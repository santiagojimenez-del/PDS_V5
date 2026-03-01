"use client";

import { useState } from "react";
import { KanbanBoard } from "@/modules/workflow/components/kanban-board";
import { CalendarView } from "@/modules/workflow/components/calendar-view";
import { ListView } from "@/modules/workflow/components/list-view";
import { Button } from "@/components/ui/button";
import {
  IconPlus,
  IconDownload,
  IconLayoutBoard,
  IconCalendar,
  IconList,
} from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "calendar" | "list";

const VIEW_OPTIONS: { key: ViewMode; label: string; Icon: React.ElementType }[] =
  [
    { key: "kanban", label: "Kanban", Icon: IconLayoutBoard },
    { key: "calendar", label: "Calendar", Icon: IconCalendar },
    { key: "list", label: "List", Icon: IconList },
  ];

export default function JobDashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const handleExport = async () => {
    try {
      const response = await fetch("/api/workflow/jobs/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export jobs:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Job Dashboard</h2>
          <p className="text-muted-foreground">
            Manage jobs across all pipeline stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            {VIEW_OPTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={handleExport}>
            <IconDownload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Link href="/workflow/jobs/new">
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Job</span>
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === "kanban" && <KanbanBoard />}
      {viewMode === "calendar" && <CalendarView />}
      {viewMode === "list" && <ListView />}
    </div>
  );
}
