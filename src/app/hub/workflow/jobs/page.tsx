import { KanbanBoard } from "@/modules/workflow/components/kanban-board";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export default function JobDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Job Dashboard</h2>
          <p className="text-muted-foreground">
            Manage jobs across all pipeline stages.
          </p>
        </div>
        <Link href="/workflow/jobs/new">
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      <KanbanBoard />
    </div>
  );
}
