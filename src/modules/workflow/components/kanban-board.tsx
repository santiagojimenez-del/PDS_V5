"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  IconSearch,
  IconMapPin,
  IconBuilding,
  IconUser,
  IconCalendar,
  IconFileText,
  IconClock,
  IconCash,
  IconCircleCheck,
  IconSend,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { type JobData } from "./job-card";
import { PIPELINES } from "@/lib/constants";
import { BulkToolbar } from "./bulk-toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface JobsResponse {
  jobs: JobData[];
  counts: Record<string, number>;
}

interface Filters {
  client: string;
  site: string;
  product: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  client: "",
  site: "",
  product: "",
  dateFrom: "",
  dateTo: "",
};

const KANBAN_COLUMNS = [
  {
    key: PIPELINES.BIDS,
    label: "Bids",
    icon: IconFileText,
    color: "text-yellow-600 dark:text-yellow-400",
    headerBg: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  {
    key: PIPELINES.SCHEDULED,
    label: "Scheduled",
    icon: IconClock,
    color: "text-blue-600 dark:text-blue-400",
    headerBg: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  {
    key: PIPELINES.PROCESSING_DELIVER,
    label: "Processing",
    icon: IconSend,
    color: "text-purple-600 dark:text-purple-400",
    headerBg: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500",
  },
  {
    key: PIPELINES.BILL,
    label: "Bill",
    icon: IconCash,
    color: "text-orange-600 dark:text-orange-400",
    headerBg: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
];

const PIPELINE_LABELS: Record<string, string> = {
  [PIPELINES.BIDS]: "Bids",
  [PIPELINES.SCHEDULED]: "Scheduled",
  [PIPELINES.PROCESSING_DELIVER]: "Processing",
  [PIPELINES.BILL]: "Bill",
  [PIPELINES.COMPLETED]: "Completed",
};

function toDateStr(raw: string): string {
  return raw.slice(0, 10);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(toDateStr(dateStr) + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getRelevantDate(
  dates: Record<string, string>,
  pipeline: string
): { label: string; date: string } | null {
  const map: Record<string, string[]> = {
    bids: ["created", "requested"],
    scheduled: ["scheduled", "created", "requested"],
    "processing-deliver": ["flown", "delivered", "scheduled"],
    bill: ["billed", "delivered"],
    completed: ["billed", "delivered", "flown"],
  };
  const keys = map[pipeline] || ["created", "requested"];
  for (const k of keys) {
    if (dates[k]) return { label: k, date: toDateStr(dates[k]) };
  }
  return null;
}

function getAnyDate(dates: Record<string, string>): string | null {
  const order = ["created", "scheduled", "flown", "delivered", "billed"];
  for (const k of order) {
    if (dates[k]) return dates[k];
  }
  return null;
}

async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch("/api/workflow/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const json = await res.json();
  return json.data;
}

// ── Compact card for kanban columns ──────────────────────────────────────────
function KanbanJobCard({
  job,
  isSelected,
  onToggle,
}: {
  job: JobData;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const dateInfo = getRelevantDate(job.dates, job.pipeline);

  return (
    <Card
      onClick={() => router.push(`/workflow/jobs/${job.id}`)}
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isSelected && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      <CardContent className="p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggle}
              aria-label={`Select job ${job.id}`}
              className="h-3.5 w-3.5"
            />
            <span className="text-xs font-bold text-primary">#{job.id}</span>
          </div>
          {dateInfo && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <IconCalendar className="h-3 w-3" />
              {formatDate(dateInfo.date)}
            </span>
          )}
        </div>
        <div className="mb-1 flex items-center gap-1.5">
          <IconMapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-medium">{job.siteName}</span>
        </div>
        <div className="mb-2 flex items-center gap-1.5">
          {job.clientType === "organization" ? (
            <IconBuilding className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <IconUser className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-[11px] text-muted-foreground">
            {job.clientName}
          </span>
        </div>
        {job.products.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.products.slice(0, 2).map((p) => (
              <Badge
                key={p.id}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {p.name}
              </Badge>
            ))}
            {job.products.length > 2 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{job.products.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function KanbanBoard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  // kanban selection: jobId → pipeline
  const [kanbanSelected, setKanbanSelected] = useState<Map<number, string>>(new Map());
  // pipeline conflict confirmation
  const [pipelineConflict, setPipelineConflict] = useState<{
    pendingId: number;
    pendingPipeline: string;
    currentPipeline: string;
    currentCount: number;
  } | null>(null);

  const PAGE_SIZE_OPTIONS = [10, 25, 50];

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-jobs"],
    queryFn: fetchJobs,
    refetchInterval: 30000,
  });

  const jobsByPipeline = useMemo(() => {
    const grouped: Record<string, JobData[]> = {};
    for (const job of data?.jobs || []) {
      const key = job.pipeline || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(job);
    }
    return grouped;
  }, [data?.jobs]);

  const completedJobs = useMemo(
    () => jobsByPipeline[PIPELINES.COMPLETED] || [],
    [jobsByPipeline]
  );

  // Filter options derived from completed jobs
  const filterOptions = useMemo(() => {
    const clients = new Map<string, string>();
    const sites = new Map<number, string>();
    const products = new Map<number, string>();

    for (const j of completedJobs) {
      if (j.clientName && j.clientName !== "Unknown") {
        clients.set(j.clientName, j.clientName);
      }
      if (j.siteId && j.siteName) {
        sites.set(j.siteId, j.siteName);
      }
      for (const p of j.products) {
        products.set(p.id, p.name);
      }
    }

    return {
      clients: [...clients.values()].sort(),
      sites: [...sites.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      products: [...products.entries()].sort((a, b) =>
        a[1].localeCompare(b[1])
      ),
    };
  }, [completedJobs]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.client,
      filters.site,
      filters.product,
      filters.dateFrom,
      filters.dateTo,
    ].filter(Boolean).length;
  }, [filters]);

  const filteredCompleted = useMemo(() => {
    let jobs = completedJobs;

    if (filters.client)
      jobs = jobs.filter((j) => j.clientName === filters.client);
    if (filters.site)
      jobs = jobs.filter((j) => j.siteId === Number(filters.site));
    if (filters.product) {
      const pid = Number(filters.product);
      jobs = jobs.filter((j) => j.products.some((p) => p.id === pid));
    }
    if (filters.dateFrom) {
      jobs = jobs.filter((j) => {
        const d = getAnyDate(j.dates);
        return d ? d >= filters.dateFrom : false;
      });
    }
    if (filters.dateTo) {
      jobs = jobs.filter((j) => {
        const d = getAnyDate(j.dates);
        return d ? d <= filters.dateTo : false;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.id.toString().includes(q) ||
          j.siteName.toLowerCase().includes(q) ||
          j.clientName.toLowerCase().includes(q) ||
          j.products.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    return jobs;
  }, [completedJobs, filters, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompleted.length / pageSize)
  );
  const safePage = Math.min(page, totalPages - 1);
  const paginatedCompleted = filteredCompleted.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }, []);

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const toggleJob = useCallback((jobId: number) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedJobs((prev) => {
      if (
        prev.size === paginatedCompleted.length &&
        paginatedCompleted.every((j) => prev.has(j.id))
      ) {
        return new Set();
      }
      return new Set(paginatedCompleted.map((j) => j.id));
    });
  }, [paginatedCompleted]);

  const clearSelection = useCallback(() => setSelectedJobs(new Set()), []);

  const toggleKanbanJob = useCallback((jobId: number, pipeline: string) => {
    setKanbanSelected((prev) => {
      // Deselect if already selected
      if (prev.has(jobId)) {
        const next = new Map(prev);
        next.delete(jobId);
        return next;
      }

      // Check if there's a pipeline conflict
      if (prev.size > 0) {
        const currentPipeline = [...prev.values()][0];
        if (currentPipeline !== pipeline) {
          // Trigger confirmation dialog — don't mutate state here
          setPipelineConflict({
            pendingId: jobId,
            pendingPipeline: pipeline,
            currentPipeline,
            currentCount: prev.size,
          });
          return prev; // no change yet
        }
      }

      const next = new Map(prev);
      next.set(jobId, pipeline);
      return next;
    });
  }, []);

  const clearKanbanSelection = useCallback(() => setKanbanSelected(new Map()), []);

  // If all selected kanban jobs share the same pipeline → enable actions for that pipeline
  const kanbanActivePipeline = useMemo(() => {
    if (kanbanSelected.size === 0) return "";
    const pipelines = new Set(kanbanSelected.values());
    return pipelines.size === 1 ? [...pipelines][0] : "";
  }, [kanbanSelected]);

  const kanbanSelectedIds = useMemo(
    () => new Set(kanbanSelected.keys()),
    [kanbanSelected]
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
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
    <div className="space-y-8">
      {/* ════════════════════════════════════════════════════════════════════
          KANBAN BOARD — 4 active pipeline columns
      ════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] gap-3">
          {KANBAN_COLUMNS.map((col) => {
            const colJobs = jobsByPipeline[col.key] || [];
            const count = data?.counts[col.key] || 0;
            const Icon = col.icon;

            return (
              <div
                key={col.key}
                className={cn(
                  "flex flex-1 flex-col rounded-lg border",
                  col.borderColor
                )}
              >
                {/* Column header */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-t-lg px-3 py-2.5",
                    col.headerBg
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", col.dot)} />
                    <Icon className={cn("h-4 w-4", col.color)} />
                    <span className={cn("text-sm font-semibold", col.color)}>
                      {col.label}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-[24px] rounded-full px-1.5 text-[11px]"
                  >
                    {count}
                  </Badge>
                </div>

                {/* Scrollable card list */}
                <div
                  className="flex flex-col gap-2 overflow-y-auto p-2"
                  style={{ maxHeight: "520px" }}
                >
                  {colJobs.length === 0 ? (
                    <div className="flex h-20 items-center justify-center rounded-md border border-dashed">
                      <span className="text-xs text-muted-foreground">
                        No jobs
                      </span>
                    </div>
                  ) : (
                    colJobs.map((job) => (
                      <KanbanJobCard
                        key={job.id}
                        job={job}
                        isSelected={kanbanSelected.has(job.id)}
                        onToggle={() => toggleKanbanJob(job.id, job.pipeline)}
                      />
                    ))
                  )}
                </div>

                {/* Column total */}
                {colJobs.length > 0 && (() => {
                  const total = colJobs.reduce((sum, j) => sum + (j.amountPayable ?? 0), 0);
                  return (
                    <div className={cn(
                      "flex items-center justify-between rounded-b-lg border-t px-3 py-2",
                      col.headerBg
                    )}>
                      <span className="text-[11px] text-muted-foreground">
                        {colJobs.length} job{colJobs.length !== 1 ? "s" : ""}
                      </span>
                      <span className={cn("text-xs font-semibold", col.color)}>
                        ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          COMPLETED JOBS — table section
      ════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-2 border-t pt-6">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <IconCircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-foreground">
            Completed Jobs
          </h3>
          <Badge variant="secondary" className="ml-1">
            {data?.counts[PIPELINES.COMPLETED] || 0}
          </Badge>
        </div>

        {/* Search + filters (always visible) */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search completed jobs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {filteredCompleted.length} job
                {filteredCompleted.length !== 1 ? "s" : ""}
                {(search || activeFilterCount > 0) && " filtered"}
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#ff6600] hover:text-[#e55c00]"
                  onClick={resetFilters}
                >
                  <IconX className="mr-1 h-3 w-3" /> Clear filters
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Client
                </label>
                <select
                  value={filters.client}
                  onChange={(e) => updateFilter("client", e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
                >
                  <option value="">All clients</option>
                  {filterOptions.clients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Site
                </label>
                <select
                  value={filters.site}
                  onChange={(e) => updateFilter("site", e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
                >
                  <option value="">All sites</option>
                  {filterOptions.sites.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Product
                </label>
                <select
                  value={filters.product}
                  onChange={(e) => updateFilter("product", e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
                >
                  <option value="">All products</option>
                  {filterOptions.products.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  From date
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  To date
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {filters.client && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Client: {filters.client}
                    <button
                      onClick={() => updateFilter("client", "")}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.site && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Site:{" "}
                    {filterOptions.sites.find(
                      ([id]) => id === Number(filters.site)
                    )?.[1] || filters.site}
                    <button
                      onClick={() => updateFilter("site", "")}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.product && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Product:{" "}
                    {filterOptions.products.find(
                      ([id]) => id === Number(filters.product)
                    )?.[1] || filters.product}
                    <button
                      onClick={() => updateFilter("product", "")}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    From: {filters.dateFrom}
                    <button
                      onClick={() => updateFilter("dateFrom", "")}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    To: {filters.dateTo}
                    <button
                      onClick={() => updateFilter("dateTo", "")}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table / empty state */}
        {filteredCompleted.length === 0 ? (
          <div className="rounded-lg border py-12 text-center">
            <IconCircleCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {search || activeFilterCount > 0
                ? "No completed jobs match your filters."
                : "No completed jobs yet."}
            </p>
            {activeFilterCount > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={resetFilters}
                className="mt-2 text-[#ff6600]"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden rounded-lg border md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <th className="w-10 px-3 py-3">
                      <Checkbox
                        checked={
                          paginatedCompleted.length > 0 &&
                          paginatedCompleted.every((j) =>
                            selectedJobs.has(j.id)
                          )
                        }
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Products</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompleted.map((job) => {
                    const dateInfo = getRelevantDate(
                      job.dates,
                      PIPELINES.COMPLETED
                    );
                    const isSelected = selectedJobs.has(job.id);
                    return (
                      <tr
                        key={job.id}
                        onClick={() =>
                          router.push(`/workflow/jobs/${job.id}`)
                        }
                        className={cn(
                          "border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <td
                          className="w-10 px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleJob(job.id)}
                            aria-label={`Select job ${job.id}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-primary">
                            #{job.id}
                          </span>
                          {job.name && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {job.name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <IconMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[200px]">
                              {job.siteName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {job.clientType === "organization" ? (
                              <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <IconUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="text-sm truncate max-w-[180px]">
                              {job.clientName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {dateInfo ? (
                            <div className="flex items-center gap-1.5">
                              <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                              <div>
                                <span>{formatDate(dateInfo.date)}</span>
                                <span className="ml-1 text-xs capitalize text-muted-foreground/60">
                                  ({dateInfo.label})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {job.products.map((p) => (
                              <Badge
                                key={p.id}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {p.name}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {paginatedCompleted.map((job) => {
                const dateInfo = getRelevantDate(
                  job.dates,
                  PIPELINES.COMPLETED
                );
                const isSelected = selectedJobs.has(job.id);
                return (
                  <Card
                    key={job.id}
                    onClick={() => router.push(`/workflow/jobs/${job.id}`)}
                    className={cn(
                      "cursor-pointer transition-shadow hover:shadow-md",
                      isSelected && "ring-2 ring-primary/30"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleJob(job.id)}
                            aria-label={`Select job ${job.id}`}
                          />
                          <span className="text-sm font-bold text-primary">
                            #{job.id}
                          </span>
                        </div>
                        {dateInfo && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconCalendar className="h-3 w-3" />
                            {formatDate(dateInfo.date)}
                          </span>
                        )}
                      </div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <IconMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">
                          {job.siteName}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center gap-1.5">
                        {job.clientType === "organization" ? (
                          <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <IconUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-xs text-muted-foreground">
                          {job.clientName}
                        </span>
                      </div>
                      {job.products.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.products.map((p) => (
                            <Badge
                              key={p.id}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {safePage * pageSize + 1}–
                  {Math.min(
                    (safePage + 1) * pageSize,
                    filteredCompleted.length
                  )}{" "}
                  of {filteredCompleted.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pipeline conflict confirmation dialog */}
      {pipelineConflict && (
        <Dialog open onOpenChange={() => setPipelineConflict(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Different pipeline stage</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    You have{" "}
                    <span className="font-semibold text-foreground">
                      {pipelineConflict.currentCount} job{pipelineConflict.currentCount !== 1 ? "s" : ""}
                    </span>{" "}
                    selected in{" "}
                    <span className="font-semibold text-foreground capitalize">
                      {PIPELINE_LABELS[pipelineConflict.currentPipeline] ?? pipelineConflict.currentPipeline}
                    </span>
                    , but the job you just selected belongs to{" "}
                    <span className="font-semibold text-foreground capitalize">
                      {PIPELINE_LABELS[pipelineConflict.pendingPipeline] ?? pipelineConflict.pendingPipeline}
                    </span>
                    .
                  </p>
                  <p>
                    You can only perform bulk actions on jobs from the same stage.
                    Do you want to deselect the previous jobs and start a new selection?
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPipelineConflict(null)}>
                Keep current selection
              </Button>
              <Button
                onClick={() => {
                  setKanbanSelected(new Map([[pipelineConflict.pendingId, pipelineConflict.pendingPipeline]]));
                  setPipelineConflict(null);
                }}
              >
                Switch selection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk action toolbar — completed jobs table */}
      <BulkToolbar
        selectedJobs={selectedJobs}
        activeTab={PIPELINES.COMPLETED}
        clearSelection={clearSelection}
      />

      {/* Bulk action toolbar — kanban columns */}
      <BulkToolbar
        selectedJobs={kanbanSelectedIds}
        activeTab={kanbanActivePipeline}
        clearSelection={clearKanbanSelection}
        bottomOffset={selectedJobs.size > 0 ? "bottom-20" : "bottom-4"}
      />
    </div>
  );
}
