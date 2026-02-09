"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRepeat, IconMapPin, IconBuilding, IconCalendar } from "@tabler/icons-react";

interface RecurringTemplate {
  id: number;
  name: string;
  active: boolean;
  isManual: boolean;
  siteName: string;
  clientName: string;
  clientType: string;
  rrule: string | null;
  timezone: string;
  amountPayable: string;
  products: unknown;
  createdAt: string | null;
}

async function fetchRecurring() {
  const res = await fetch("/api/recurring");
  if (!res.ok) throw new Error("Failed to fetch recurring templates");
  const json = await res.json();
  return json.data as { templates: RecurringTemplate[]; total: number };
}

export default function RecurringJobsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["recurring"], queryFn: fetchRecurring });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Recurring Jobs</h2>
        <p className="text-muted-foreground">
          {data?.total || 0} recurring job templates.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data?.templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconRepeat className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No recurring job templates yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.templates.map((t) => (
            <Card key={t.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <IconRepeat className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{t.name}</h3>
                    <Badge variant={t.active ? "default" : "secondary"} className="text-xs">
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                    {t.isManual && (
                      <Badge variant="outline" className="text-xs">Manual</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconMapPin className="h-3 w-3" /> {t.siteName}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconBuilding className="h-3 w-3" /> {t.clientName}
                    </span>
                    {t.rrule && (
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-3 w-3" /> {t.timezone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${t.amountPayable}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
