"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconBriefcase, IconMapPin, IconCalendar } from "@tabler/icons-react";

interface ClientJob {
  id: number;
  name: string;
  pipeline: string;
  siteName: string;
  products: string[];
  dateRequested: string | null;
  dateScheduled: string | null;
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome</h2>
        <p className="text-muted-foreground">View your projects and deliverables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Jobs</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsData?.total ?? "..."}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Sites</CardTitle>
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sitesData?.total ?? "..."}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Recent Jobs</h3>
        {jobsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : jobsData?.jobs.length === 0 ? (
          <p className="py-4 text-muted-foreground">No jobs found.</p>
        ) : (
          <div className="space-y-2">
            {jobsData?.jobs.slice(0, 10).map((j) => (
              <Card key={j.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{j.name || `Job #${j.id}`}</span>
                      <Badge variant="outline" className="text-xs">
                        {PIPELINE_LABELS[j.pipeline || ""] || j.pipeline}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="h-3 w-3" /> {j.siteName}
                      </span>
                      {j.dateScheduled && (
                        <span className="flex items-center gap-1">
                          <IconCalendar className="h-3 w-3" /> {j.dateScheduled}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {j.products.join(", ")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Your Sites</h3>
        {sitesLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : sitesData?.sites.length === 0 ? (
          <p className="py-4 text-muted-foreground">No sites found.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sitesData?.sites.map((s) => (
              <Card key={s.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconMapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{s.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{s.jobCount} jobs</Badge>
                  </div>
                  {s.address && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.address}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
