"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconBriefcase, IconMapPin, IconCalendar, IconArrowLeft, IconPackage } from "@tabler/icons-react";
import Link from "next/link";

interface ClientJob {
  id: number;
  name: string;
  pipeline: string;
  siteName: string;
  products: string[];
  dateRequested: string | null;
  dateScheduled: string | null;
}

async function fetchJob(jobId: string) {
  const res = await fetch("/api/client/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const json = await res.json();
  const job = json.data.jobs.find((j: ClientJob) => j.id === parseInt(jobId, 10));
  return job || null;
}

const PIPELINE_LABELS: Record<string, string> = {
  bids: "Bid", scheduled: "Scheduled", "processing-deliver": "Processing",
  bill: "Billing", completed: "Completed",
};

const PIPELINE_COLORS: Record<string, string> = {
  bids: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  scheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "processing-deliver": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  bill: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function ClientJobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: job, isLoading } = useQuery({
    queryKey: ["client-job", id],
    queryFn: () => fetchJob(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!job) {
    return <p className="py-8 text-center text-muted-foreground">Job not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/client" className="text-muted-foreground hover:text-foreground">
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">{job.name || `Job #${job.id}`}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PIPELINE_COLORS[job.pipeline || ""] || "bg-muted text-muted-foreground"}`}>
              {PIPELINE_LABELS[job.pipeline || ""] || job.pipeline}
            </span>
          </div>
          <p className="text-muted-foreground">Job #{job.id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBriefcase className="h-4 w-4" /> Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <IconMapPin className="h-4 w-4 text-muted-foreground" />
              <span>Site: {job.siteName}</span>
            </div>
            {job.dateRequested && (
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span>Requested: {job.dateRequested}</span>
              </div>
            )}
            {job.dateScheduled && (
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span>Scheduled: {job.dateScheduled}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconPackage className="h-4 w-4" /> Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.products.length > 0 ? (
              <div className="space-y-2">
                {job.products.map((product: string, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded border p-2">
                    <span className="text-sm font-medium">{product}</span>
                    <Link href={`/client/job/${job.id}/product/${i}`}>
                      <Badge variant="outline" className="cursor-pointer text-xs hover:bg-accent">
                        View
                      </Badge>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No products assigned.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
