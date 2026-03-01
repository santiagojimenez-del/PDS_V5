"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconSearch,
  IconMapPin,
  IconBuilding,
  IconUser,
  IconCalendar,
  IconFilter,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
  IconEye,
  IconPackage,
} from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type JobData } from "./job-card";
import { PIPELINES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface JobsResponse {
  jobs: JobData[];
  counts: Record<string, number>;
}

interface Filters {
  pipeline: string;
  client: string;
  site: string;
  product: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  pipeline: "",
  client: "",
  site: "",
  product: "",
  dateFrom: "",
  dateTo: "",
};

type SortField = "id" | "pipeline" | "site" | "client" | "date";
type SortDir = "asc" | "desc";

const PIPELINE_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  [PIPELINES.BIDS]: {
    label: "Bid",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  [PIPELINES.SCHEDULED]: {
    label: "Scheduled",
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  [PIPELINES.PROCESSING_DELIVER]: {
    label: "Processing",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  [PIPELINES.BILL]: {
    label: "Bill",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  [PIPELINES.COMPLETED]: {
    label: "Completed",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dot: "bg-green-500",
  },
};

/** Normalizes any date string to "YYYY-MM-DD" (handles full ISO and plain date) */
function toDateStr(raw: string): string {
  return raw.slice(0, 10);
}

function formatDate(dateStr: string): string {
  try {
    // Normalize to YYYY-MM-DD first, then parse as local time
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
  for (const k of ["created", "requested", "scheduled", "flown", "delivered", "billed"]) {
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

function SortIcon({
  field,
  current,
  dir,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
}) {
  if (field !== current)
    return (
      <span className="ml-1 inline-flex opacity-30">
        <IconChevronUp className="h-3 w-3 -mb-1" />
        <IconChevronDown className="h-3 w-3 -mt-1" />
      </span>
    );
  return dir === "asc" ? (
    <IconChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <IconChevronDown className="ml-1 inline h-3.5 w-3.5" />
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function ListView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-jobs"],
    queryFn: fetchJobs,
    refetchInterval: 30000,
  });

  const allJobs = data?.jobs || [];

  // Derive filter options from all jobs
  const filterOptions = useMemo(() => {
    const clients = new Map<string, string>();
    const sites = new Map<number, string>();
    const products = new Map<number, string>();

    for (const j of allJobs) {
      if (j.clientName && j.clientName !== "Unknown")
        clients.set(j.clientName, j.clientName);
      if (j.siteId && j.siteName) sites.set(j.siteId, j.siteName);
      for (const p of j.products) products.set(p.id, p.name);
    }

    return {
      clients: [...clients.values()].sort(),
      sites: [...sites.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      products: [...products.entries()].sort((a, b) =>
        a[1].localeCompare(b[1])
      ),
    };
  }, [allJobs]);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.pipeline,
        filters.client,
        filters.site,
        filters.product,
        filters.dateFrom,
        filters.dateTo,
      ].filter(Boolean).length,
    [filters]
  );

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortField]
  );

  const filtered = useMemo(() => {
    let jobs = allJobs;

    if (filters.pipeline)
      jobs = jobs.filter((j) => j.pipeline === filters.pipeline);
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
          (j.name || "").toLowerCase().includes(q) ||
          j.products.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...jobs].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id":
          cmp = a.id - b.id;
          break;
        case "pipeline": {
          const order = [
            PIPELINES.BIDS,
            PIPELINES.SCHEDULED,
            PIPELINES.PROCESSING_DELIVER,
            PIPELINES.BILL,
            PIPELINES.COMPLETED,
          ];
          cmp =
            order.indexOf(a.pipeline) - order.indexOf(b.pipeline);
          break;
        }
        case "site":
          cmp = a.siteName.localeCompare(b.siteName);
          break;
        case "client":
          cmp = a.clientName.localeCompare(b.clientName);
          break;
        case "date": {
          const da = getAnyDate(a.dates) || "";
          const db = getAnyDate(b.dates) || "";
          cmp = da.localeCompare(db);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allJobs, filters, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
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
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search all jobs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 gap-1.5",
              activeFilterCount > 0 &&
                !showFilters &&
                "bg-[#ff6600] hover:bg-[#e55c00] text-white"
            )}
          >
            <IconFilter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}
          {(search || activeFilterCount > 0) && " filtered"} &middot;{" "}
          {allJobs.length} total
        </p>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Filters</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={resetFilters}
              >
                <IconX className="mr-1 h-3 w-3" /> Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {/* Pipeline filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Pipeline
              </label>
              <select
                value={filters.pipeline}
                onChange={(e) => updateFilter("pipeline", e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
              >
                <option value="">All stages</option>
                {Object.entries(PIPELINE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
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

          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {filters.pipeline && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Stage: {PIPELINE_CONFIG[filters.pipeline]?.label}
                  <button
                    onClick={() => updateFilter("pipeline", "")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              )}
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
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border py-16 text-center">
          <p className="text-muted-foreground">
            {search || activeFilterCount > 0
              ? "No jobs match your filters."
              : "No jobs found."}
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
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <th
                      className="cursor-pointer select-none px-4 py-3 hover:text-foreground"
                      onClick={() => handleSort("id")}
                    >
                      Job
                      <SortIcon field="id" current={sortField} dir={sortDir} />
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 hover:text-foreground"
                      onClick={() => handleSort("client")}
                    >
                      Client
                      <SortIcon field="client" current={sortField} dir={sortDir} />
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 hover:text-foreground"
                      onClick={() => handleSort("site")}
                    >
                      Site
                      <SortIcon field="site" current={sortField} dir={sortDir} />
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 hover:text-foreground"
                      onClick={() => handleSort("pipeline")}
                    >
                      Stage
                      <SortIcon field="pipeline" current={sortField} dir={sortDir} />
                    </th>
                    <th className="px-4 py-3">Products</th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 hover:text-foreground"
                      onClick={() => handleSort("date")}
                    >
                      Date
                      <SortIcon field="date" current={sortField} dir={sortDir} />
                    </th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((job) => {
                    const dateInfo = getRelevantDate(job.dates, job.pipeline);
                    const pipelineCfg =
                      PIPELINE_CONFIG[job.pipeline] ||
                      PIPELINE_CONFIG[PIPELINES.BIDS];
                    return (
                      <tr
                        key={job.id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30"
                      >
                        {/* Job name + ID */}
                        <td className="px-4 py-3">
                          <p className="max-w-[200px] truncate text-sm font-medium text-foreground">
                            {job.name || <span className="text-muted-foreground italic">Unnamed</span>}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            #{job.id}
                          </span>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {job.clientType === "organization" ? (
                              <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <IconUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="max-w-[180px] truncate text-sm">
                              {job.clientName}
                            </span>
                          </div>
                        </td>

                        {/* Site */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <IconMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="max-w-[200px] truncate text-sm">
                              {job.siteName}
                            </span>
                          </div>
                        </td>

                        {/* Pipeline stage */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              pipelineCfg.color
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", pipelineCfg.dot)} />
                            {pipelineCfg.label}
                          </span>
                        </td>

                        {/* Products count — click to expand */}
                        <td className="px-4 py-3">
                          {job.products.length === 0 ? (
                            <span className="text-sm text-muted-foreground/40">—</span>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                  <IconPackage className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    {job.products.length}{" "}
                                    {job.products.length === 1 ? "product" : "products"}
                                  </span>
                                  <IconChevronDown className="h-3 w-3 opacity-50" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-52 p-2" align="start">
                                <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Products
                                </p>
                                <ul className="space-y-0.5">
                                  {job.products.map((p) => (
                                    <li
                                      key={p.id}
                                      className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm"
                                    >
                                      <IconPackage className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      {p.name}
                                    </li>
                                  ))}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          )}
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {dateInfo ? (
                            <div className="flex items-center gap-1.5">
                              <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                              <div>
                                <span>{formatDate(dateInfo.date)}</span>
                                <span className="ml-1 text-[11px] capitalize text-muted-foreground/60">
                                  ({dateInfo.label})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => router.push(`/workflow/jobs/${job.id}`)}
                            title="View job"
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {safePage * pageSize + 1}–
                {Math.min((safePage + 1) * pageSize, filtered.length)} of{" "}
                {filtered.length}
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
  );
}
