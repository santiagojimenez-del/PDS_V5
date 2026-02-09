"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconMapPin, IconBriefcase, IconArrowLeft, IconCalendar } from "@tabler/icons-react";
import Link from "next/link";

interface SiteDetail {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  coordinates: unknown;
  jobCount: number;
}

interface SiteJob {
  id: number;
  name: string;
  pipeline: string;
  siteName: string;
  products: string[];
  dateScheduled: string | null;
}

async function fetchSiteWithJobs(siteId: string) {
  const [sitesRes, jobsRes] = await Promise.all([
    fetch("/api/client/sites"),
    fetch("/api/client/jobs"),
  ]);
  if (!sitesRes.ok || !jobsRes.ok) throw new Error("Failed to fetch data");
  const sitesJson = await sitesRes.json();
  const jobsJson = await jobsRes.json();
  const site = sitesJson.data.sites.find((s: SiteDetail) => s.id === parseInt(siteId, 10));
  const siteJobs = jobsJson.data.jobs.filter((j: SiteJob) =>
    site ? j.siteName === site.name : false
  );
  return { site: site || null, jobs: siteJobs as SiteJob[] };
}

const PIPELINE_LABELS: Record<string, string> = {
  bids: "Bid", scheduled: "Scheduled", "processing-deliver": "Processing",
  bill: "Billing", completed: "Completed",
};

export default function ClientSiteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useQuery({
    queryKey: ["client-site", id],
    queryFn: () => fetchSiteWithJobs(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data?.site) {
    return <p className="py-8 text-center text-muted-foreground">Site not found.</p>;
  }

  const site = data.site;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/client/sites" className="text-muted-foreground hover:text-foreground">
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{site.name}</h2>
          <p className="text-muted-foreground">Site #{site.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconMapPin className="h-4 w-4" /> Site Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {site.address && <p><span className="font-medium">Address:</span> {site.address}</p>}
          {site.description && <p><span className="font-medium">Description:</span> {site.description}</p>}
          <p><span className="font-medium">Jobs at this site:</span> {site.jobCount}</p>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Jobs at This Site</h3>
        {data.jobs.length === 0 ? (
          <p className="text-muted-foreground">No jobs at this site.</p>
        ) : (
          <div className="space-y-2">
            {data.jobs.map((j) => (
              <Link key={j.id} href={`/client/job/${j.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <IconBriefcase className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{j.name || `Job #${j.id}`}</span>
                        <Badge variant="outline" className="text-xs">
                          {PIPELINE_LABELS[j.pipeline || ""] || j.pipeline}
                        </Badge>
                      </div>
                      {j.dateScheduled && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <IconCalendar className="h-3 w-3" /> {j.dateScheduled}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {j.products.join(", ")}
                    </div>
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
