"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import { type JobData } from "./job-card";
import { PIPELINES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BulkToolbar } from "./bulk-toolbar";

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

const EMPTY_FILTERS: Filters = { client: "", site: "", product: "", dateFrom: "", dateTo: "" };

const PIPELINE_CONFIG = [
  {
    key: PIPELINES.BIDS,
    label: "Bids",
    icon: IconFileText,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500",
  },
  {
    key: PIPELINES.SCHEDULED,
    label: "Scheduled",
    icon: IconClock,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500",
  },
  {
    key: PIPELINES.PROCESSING_DELIVER,
    label: "Processing",
    icon: IconSend,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500",
  },
  {
    key: PIPELINES.BILL,
    label: "Bill",
    icon: IconCash,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500",
  },
  {
    key: PIPELINES.COMPLETED,
    label: "Completed",
    icon: IconCircleCheck,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500",
  },
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getRelevantDate(dates: Record<string, string>, pipeline: string): { label: string; date: string } | null {
  const map: Record<string, string[]> = {
    bids: ["created"],
    scheduled: ["scheduled", "created"],
    "processing-deliver": ["flown", "delivered", "scheduled"],
    bill: ["billed", "delivered"],
    completed: ["billed", "delivered", "flown"],
  };
  const keys = map[pipeline] || ["created"];
  for (const k of keys) {
    if (dates[k]) return { label: k, date: dates[k] };
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

export function KanbanBoard() {
  const [activeTab, setActiveTab] = useState<string>(PIPELINES.BIDS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

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

  const tabJobs = useMemo(() => jobsByPipeline[activeTab] || [], [jobsByPipeline, activeTab]);

  // Extract unique filter options from current tab
  const filterOptions = useMemo(() => {
    const clients = new Map<string, string>();
    const sites = new Map<number, string>();
    const products = new Map<number, string>();

    for (const j of tabJobs) {
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
      products: [...products.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    };
  }, [tabJobs]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.client) count++;
    if (filters.site) count++;
    if (filters.product) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  const filteredJobs = useMemo(() => {
    let jobs = tabJobs;

    // Apply category filters
    if (filters.client) {
      jobs = jobs.filter((j) => j.clientName === filters.client);
    }
    if (filters.site) {
      jobs = jobs.filter((j) => j.siteId === Number(filters.site));
    }
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

    // Apply text search on top of filters
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
  }, [tabJobs, filters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedJobs = filteredJobs.slice(safePage * pageSize, (safePage + 1) * pageSize);

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
      if (prev.size === paginatedJobs.length && paginatedJobs.every((j) => prev.has(j.id))) {
        return new Set();
      }
      return new Set(paginatedJobs.map((j) => j.id));
    });
  }, [paginatedJobs]);

  const clearSelection = useCallback(() => setSelectedJobs(new Set()), []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
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

  const totalJobs = Object.values(data?.counts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Pipeline summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PIPELINE_CONFIG.map((config) => {
          const count = data?.counts[config.key] || 0;
          const isActive = activeTab === config.key;
          const Icon = config.icon;
          return (
            <button
              key={config.key}
              onClick={() => { setActiveTab(config.key); setSearch(""); setPage(0); resetFilters(); setShowFilters(false); clearSelection(); }}
              className={cn(
                "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                isActive
                  ? "border-transparent bg-card shadow-md ring-2 ring-[#ff6600]"
                  : "border-border bg-card hover:shadow-sm"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className={cn("h-4 w-4", isActive ? "text-[#ff6600]" : config.color)} />
                {isActive && <div className={cn("h-2 w-2 rounded-full", config.bg)} />}
              </div>
              <span className="text-2xl font-bold text-foreground">{count}</span>
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search + filters toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search in ${PIPELINE_CONFIG.find((c) => c.key === activeTab)?.label}...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 gap-1.5",
              activeFilterCount > 0 && !showFilters && "bg-[#ff6600] hover:bg-[#e55c00] text-white"
            )}
          >
            <IconFilter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
          {(search || activeFilterCount > 0) && " filtered"}
          {" "}&middot; {totalJobs} total
        </p>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Filters</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={resetFilters}>
                <IconX className="mr-1 h-3 w-3" /> Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Client filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Client</label>
              <select
                value={filters.client}
                onChange={(e) => updateFilter("client", e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
              >
                <option value="">All clients</option>
                {filterOptions.clients.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Site filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Site</label>
              <select
                value={filters.site}
                onChange={(e) => updateFilter("site", e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
              >
                <option value="">All sites</option>
                {filterOptions.sites.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            {/* Product filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Product</label>
              <select
                value={filters.product}
                onChange={(e) => updateFilter("product", e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
              >
                <option value="">All products</option>
                {filterOptions.products.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Date to */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To date</label>
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
                  <button onClick={() => updateFilter("client", "")} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.site && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Site: {filterOptions.sites.find(([id]) => id === Number(filters.site))?.[1] || filters.site}
                  <button onClick={() => updateFilter("site", "")} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.product && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Product: {filterOptions.products.find(([id]) => id === Number(filters.product))?.[1] || filters.product}
                  <button onClick={() => updateFilter("product", "")} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.dateFrom && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  From: {filters.dateFrom}
                  <button onClick={() => updateFilter("dateFrom", "")} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  To: {filters.dateTo}
                  <button onClick={() => updateFilter("dateTo", "")} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Jobs table (desktop) / cards (mobile) */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-lg border py-12 text-center">
          <p className="text-muted-foreground">
            {search || activeFilterCount > 0 ? "No jobs match your filters." : "No jobs in this stage."}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="link" size="sm" onClick={resetFilters} className="mt-2 text-[#ff6600]">
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
                      checked={paginatedJobs.length > 0 && paginatedJobs.every((j) => selectedJobs.has(j.id))}
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
                {paginatedJobs.map((job) => {
                  const dateInfo = getRelevantDate(job.dates, activeTab);
                  const isSelected = selectedJobs.has(job.id);
                  return (
                    <tr
                      key={job.id}
                      className={cn(
                        "border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <td className="w-10 px-3 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleJob(job.id)}
                          aria-label={`Select job ${job.id}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-primary">#{job.id}</span>
                        {job.name && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{job.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <IconMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{job.siteName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {job.clientType === "organization" ? (
                            <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <IconUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="text-sm truncate max-w-[180px]">{job.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {dateInfo ? (
                          <div className="flex items-center gap-1.5">
                            <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                            <div>
                              <span>{formatDate(dateInfo.date)}</span>
                              <span className="ml-1 text-xs capitalize text-muted-foreground/60">({dateInfo.label})</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {job.products.map((p) => (
                            <Badge key={p.id} variant="secondary" className="text-[10px] px-1.5 py-0">
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
            {paginatedJobs.map((job) => {
              const dateInfo = getRelevantDate(job.dates, activeTab);
              const isSelected = selectedJobs.has(job.id);
              return (
                <Card key={job.id} className={cn("cursor-pointer transition-shadow hover:shadow-md relative", isSelected && "ring-2 ring-primary/30")}>
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleJob(job.id)}
                          aria-label={`Select job ${job.id}`}
                        />
                        <span className="text-sm font-bold text-primary">#{job.id}</span>
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
                      <span className="truncate text-sm font-medium">{job.siteName}</span>
                    </div>
                    <div className="mb-2 flex items-center gap-1.5">
                      {job.clientType === "organization" ? (
                        <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <IconUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs text-muted-foreground">{job.clientName}</span>
                    </div>
                    {job.products.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.products.map((p) => (
                          <Badge key={p.id} variant="secondary" className="text-[10px] px-1.5 py-0">
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

          {/* Pagination footer */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredJobs.length)} of {filteredJobs.length}
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

          {/* Completed jobs notice */}
          {activeTab === PIPELINES.COMPLETED &&
            (data?.counts[PIPELINES.COMPLETED] || 0) > filteredJobs.length &&
            !search && activeFilterCount === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Showing latest {filteredJobs.length} of {data?.counts[PIPELINES.COMPLETED]} completed jobs
              </p>
            )}
        </>
      )}

      {/* Bulk action toolbar */}
      <BulkToolbar
        selectedJobs={selectedJobs}
        activeTab={activeTab}
        clearSelection={clearSelection}
      />
    </div>
  );
}
