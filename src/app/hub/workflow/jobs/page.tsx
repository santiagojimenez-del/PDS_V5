"use client";

import { KanbanBoard } from "@/modules/workflow/components/kanban-board";
import { Button } from "@/components/ui/button";
import { IconPlus, IconDownload } from "@tabler/icons-react";
import Link from "next/link";

export default function JobDashboardPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Job Dashboard</h2>
          <p className="text-muted-foreground">
            Manage jobs across all pipeline stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <IconDownload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Link href="/workflow/jobs/new">
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      <KanbanBoard />
    </div>
  );
}
