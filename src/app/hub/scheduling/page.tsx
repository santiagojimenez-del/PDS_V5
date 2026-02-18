"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCalendar, IconUser, IconChevronRight, IconClock } from "@tabler/icons-react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

async function fetchPilots() {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  const users = json.data.users as User[];
  return users.filter((u) => u.role === "Pilot" || u.role === "Staff");
}

export default function SchedulingDashboardPage() {
  const { data: pilots, isLoading } = useQuery({
    queryKey: ["pilots"],
    queryFn: fetchPilots,
  });

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const pilotCount = pilots?.filter((p) => p.role === "Pilot").length || 0;
  const staffCount = pilots?.filter((p) => p.role === "Staff").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduling Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Week of {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/scheduling/pilots">
            <Button variant="outline">
              <IconUser className="mr-2 h-4 w-4" />
              Manage Pilots
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <IconUser className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pilotCount}</p>
                <p className="text-sm text-muted-foreground">Active Pilots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <IconUser className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffCount}</p>
                <p className="text-sm text-muted-foreground">Staff Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <IconCalendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">Jobs This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <IconClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">Avg Hours/Pilot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common scheduling tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/scheduling/pilots">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <IconUser className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Manage Availability</p>
                    <p className="text-xs text-muted-foreground">
                      Set pilot schedules and blackout dates
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/workflow/jobs">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <IconCalendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Schedule Jobs</p>
                    <p className="text-xs text-muted-foreground">
                      Assign pilots to upcoming jobs
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/scheduling/pilots">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <IconClock className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">View Schedules</p>
                    <p className="text-xs text-muted-foreground">
                      Check pilot weekly calendars
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pilot List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>Quick access to pilot schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {pilots && pilots.length > 0 ? (
            <div className="space-y-2">
              {pilots.slice(0, 10).map((pilot) => (
                <Link key={pilot.id} href={`/scheduling/pilots/${pilot.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <IconUser className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{pilot.name}</p>
                        <p className="text-xs text-muted-foreground">{pilot.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pilot.role === "Pilot" ? "default" : "secondary"}>
                        {pilot.role}
                      </Badge>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
              {pilots.length > 10 && (
                <Link href="/scheduling/pilots">
                  <Button variant="outline" className="w-full">
                    View All {pilots.length} Pilots
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pilots or staff found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
