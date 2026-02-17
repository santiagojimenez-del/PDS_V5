"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  IconBriefcase,
  IconMapPin,
  IconCalendar,
  IconDownload,
  IconTrendingUp,
  IconCheckCircle,
  IconClock,
} from "@tabler/icons-react";
import Link from "next/link";

interface ClientJob {
  id: number;
  name: string;
  pipeline: string;
  siteName: string;
  products: string[];
  dateRequested: string | null;
  dateScheduled: string | null;
  dateCompleted: string | null;
}

interface ClientSite {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  jobCount: number;
}

async function fetchClientJobs() {
  const res = await fetch("/api/client/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const json = await res.json();
  return json.data as { jobs: ClientJob[]; total: number };
}

async function fetchClientSites() {
  const res = await fetch("/api/client/sites");
  if (!res.ok) throw new Error("Failed to fetch sites");
  const json = await res.json();
  return json.data as { sites: ClientSite[]; total: number };
}

const PIPELINE_LABELS: Record<string, string> = {
  bids: "Bid",
  scheduled: "Scheduled",
  "processing-deliver": "Processing",
  bill: "Billing",
  completed: "Completed",
};

export default function ClientHomePage() {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["client-jobs"],
    queryFn: fetchClientJobs,
  });

  const { data: sitesData, isLoading: sitesLoading } = useQuery({
    queryKey: ["client-sites"],
    queryFn: fetchClientSites,
  });

  const handleExportJobs = async () => {
    try {
      const response = await fetch("/api/client/jobs/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my_jobs_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export jobs:", error);
    }
  };

  // Calculate stats
  const jobsByStatus = jobsData?.jobs.reduce((acc, job) => {
    acc[job.pipeline] = (acc[job.pipeline] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const completed = jobsByStatus.completed || 0;
  const inProgress = (jobsByStatus.scheduled || 0) + (jobsByStatus["processing-deliver"] || 0);
  const pending = jobsByStatus.bids || 0;
  const completionRate = jobsData?.total ? (completed / jobsData.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome</h2>
        <p className="text-muted-foreground">View your projects and deliverables.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsData?.total ?? "..."}</div>
            <p className="text-xs text-muted-foreground">All jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <IconCheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate.toFixed(0)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <IconClock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Sites</CardTitle>
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sitesData?.total ?? "..."}</div>
            <p className="text-xs text-muted-foreground">Locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview */}
      {!jobsLoading && jobsData && jobsData.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Status Overview</CardTitle>
            <CardDescription>Distribution of your projects by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "bids", label: "Pending Bid", color: "bg-yellow-500", count: pending },
              {
                key: "scheduled",
                label: "Scheduled",
                color: "bg-blue-500",
                count: jobsByStatus.scheduled || 0,
              },
              {
                key: "processing-deliver",
                label: "Processing",
                color: "bg-purple-500",
                count: jobsByStatus["processing-deliver"] || 0,
              },
              { key: "bill", label: "Billing", color: "bg-orange-500", count: jobsByStatus.bill || 0 },
              { key: "completed", label: "Completed", color: "bg-green-500", count: completed },
            ].map((status) => {
              const percentage = jobsData.total ? (status.count / jobsData.total) * 100 : 0;

              return (
                <div key={status.key} className="flex items-center gap-4">
                  <div className="flex w-32 items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${status.color}`} />
                    <span className="text-sm font-medium">{status.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="flex-1" />
                      <span className="w-12 text-right text-sm font-medium">{status.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Jobs</h3>
          {jobsData && jobsData.jobs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportJobs}>
              <IconDownload className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>

        {jobsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : jobsData?.jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <IconBriefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No jobs found.</p>
              <p className="text-sm text-muted-foreground">
                Contact us to request a new project.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobsData?.jobs.slice(0, 10).map((j) => (
              <Link key={j.id} href={`/job/${j.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{j.name || `Job #${j.id}`}</span>
                        <Badge variant="outline" className="text-xs">
                          {PIPELINE_LABELS[j.pipeline || ""] || j.pipeline}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconMapPin className="h-3 w-3" /> {j.siteName}
                        </span>
                        {j.dateScheduled && (
                          <span className="flex items-center gap-1">
                            <IconCalendar className="h-3 w-3" /> {j.dateScheduled}
                          </span>
                        )}
                        {j.products.length > 0 && (
                          <span>{j.products.length} deliverable(s)</span>
                        )}
                      </div>
                    </div>
                    {j.dateCompleted && (
                      <IconCheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Your Sites */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Sites</h3>
          {sitesData && sitesData.sites.length > 0 && (
            <Link href="/sites">
              <Button variant="outline" size="sm">
                View All Sites
              </Button>
            </Link>
          )}
        </div>

        {sitesLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : sitesData?.sites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <IconMapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No sites found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sitesData?.sites.slice(0, 6).map((s) => (
              <Link key={s.id} href={`/site/${s.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconMapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {s.jobCount} job{s.jobCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {s.address && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                        {s.address}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
