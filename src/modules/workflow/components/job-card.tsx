"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IconMapPin, IconBuilding, IconUser, IconCalendar } from "@tabler/icons-react";

export interface JobData {
  id: number;
  pipeline: string;
  name: string | null;
  siteName: string;
  siteId: number;
  clientName: string;
  clientType: string | null;
  clientId: number | null;
  dates: Record<string, string>;
  products: { id: number; name: string }[];
}

interface JobCardProps {
  job: JobData;
}

function getLatestDate(dates: Record<string, string>): { label: string; date: string } | null {
  const dateOrder = ["billed", "delivered", "logged", "flown", "scheduled", "created"];
  for (const key of dateOrder) {
    if (dates[key]) {
      return { label: key, date: dates[key] };
    }
  }
  return null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function JobCard({ job }: JobCardProps) {
  const latestDate = getLatestDate(job.dates);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent className="p-3">
        {/* Header: Job ID + Date */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-primary">#{job.id}</span>
          {latestDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconCalendar className="h-3 w-3" />
              {formatDate(latestDate.date)}
            </span>
          )}
        </div>

        {/* Site name */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <IconMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{job.siteName}</span>
        </div>

        {/* Client */}
        <div className="mb-2 flex items-center gap-1.5">
          {job.clientType === "organization" ? (
            <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <IconUser className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-xs text-muted-foreground">{job.clientName}</span>
        </div>

        {/* Products */}
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
      </CardContent>
    </Card>
  );
}
