"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconNetwork, IconUser, IconClock } from "@tabler/icons-react";

interface SessionData {
  userId: number;
  email: string;
  fullName: string;
  roles: number[];
  sessionCount: number;
}

async function fetchActiveSessions() {
  const res = await fetch("/api/admin/sessions");
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const json = await res.json();
  return json.data as { sessions: SessionData[]; total: number };
}

const ROLE_NAMES: Record<number, string> = {
  0: "Admin", 1: "Client", 3: "Registered", 4: "Developer",
  5: "Staff", 6: "Pilot", 7: "Manager",
};

export default function ActiveVisitorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: fetchActiveSessions,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Active Connections</h2>
        <p className="text-muted-foreground">
          {data?.total || 0} users with active sessions. Auto-refreshes every 15s.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : data?.sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconNetwork className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No active sessions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data?.sessions.map((s) => (
            <Card key={s.userId}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <IconUser className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{s.fullName || s.email}</span>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-xs">
                      {ROLE_NAMES[r] || `Role ${r}`}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    <IconClock className="mr-1 h-3 w-3" />
                    {s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
