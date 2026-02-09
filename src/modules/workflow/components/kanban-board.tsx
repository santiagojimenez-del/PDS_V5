"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { JobCard, type JobData } from "./job-card";
import { PIPELINES } from "@/lib/constants";

interface JobsResponse {
  jobs: JobData[];
  counts: Record<string, number>;
}

const PIPELINE_CONFIG = [
  {
    key: PIPELINES.BIDS,
    label: "Bids",
    color: "bg-yellow-500",
    badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  {
    key: PIPELINES.SCHEDULED,
    label: "Scheduled",
    color: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    key: PIPELINES.PROCESSING_DELIVER,
    label: "Processing / Deliver",
    color: "bg-purple-500",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  {
    key: PIPELINES.BILL,
    label: "Bill",
    color: "bg-orange-500",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  {
    key: PIPELINES.COMPLETED,
    label: "Completed",
    color: "bg-green-500",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
];

async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch("/api/workflow/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const json = await res.json();
  return json.data;
}

function KanbanColumn({
  config,
  jobs,
  totalCount,
}: {
  config: (typeof PIPELINE_CONFIG)[number];
  jobs: JobData[];
  totalCount: number;
}) {
  return (
    <div className="flex min-w-[280px] flex-col rounded-lg border bg-muted/50">
      {/* Column header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
          <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {totalCount}
        </Badge>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
        <div className="space-y-2">
          {jobs.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No jobs in this stage
            </p>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
          {config.key === PIPELINES.COMPLETED && totalCount > jobs.length && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              Showing {jobs.length} of {totalCount} completed jobs
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function KanbanBoard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-jobs"],
    queryFn: fetchJobs,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-muted/50 p-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
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

  const jobsByPipeline: Record<string, JobData[]> = {};
  for (const job of data?.jobs || []) {
    const key = job.pipeline || "unknown";
    if (!jobsByPipeline[key]) jobsByPipeline[key] = [];
    jobsByPipeline[key].push(job);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_CONFIG.map((config) => (
        <KanbanColumn
          key={config.key}
          config={config}
          jobs={jobsByPipeline[config.key] || []}
          totalCount={data?.counts[config.key] || 0}
        />
      ))}
    </div>
  );
}
