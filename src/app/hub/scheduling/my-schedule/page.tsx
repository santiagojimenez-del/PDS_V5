"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBriefcase,
  IconCalendar,
  IconMapPin,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import { startOfWeek, addDays, addWeeks, subWeeks, format } from "date-fns";
import { useCurrentUser } from "@/modules/permissions/hooks/use-permissions";
import { PilotAvailabilityManager } from "@/modules/scheduling/components/pilot-availability-manager";
import { PilotBlackoutManager } from "@/modules/scheduling/components/pilot-blackout-manager";
import { PilotScheduleCalendar } from "@/modules/scheduling/components/pilot-schedule-calendar";

interface MyAssignment {
  id: number;
  name: string;
  pipeline: string | null;
  siteName: string;
  scheduledDate: string | null;
  flownDate: string | null;
  requestedDate: string | null;
}

const PIPELINE_COLORS: Record<string, string> = {
  bids: "bg-yellow-500",
  scheduled: "bg-blue-500",
  processing_deliver: "bg-purple-500",
  bill: "bg-orange-500",
  completed: "bg-green-500",
};

async function fetchMyAssignments(status: string) {
  const res = await fetch(`/api/scheduling/my-assignments?status=${status}`);
  if (!res.ok) throw new Error("Failed to fetch assignments");
  const json = await res.json();
  return json.data as { assignments: MyAssignment[]; total: number };
}

export default function MySchedulePage() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const currentUser = userData?.data?.user ?? null;

  const [statusTab, setStatusTab] = useState<"upcoming" | "completed" | "all">("upcoming");
  const [weekOffset, setWeekOffset] = useState(0);

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStart = weekOffset === 0
    ? baseMonday
    : weekOffset > 0
    ? addWeeks(baseMonday, weekOffset)
    : subWeeks(baseMonday, Math.abs(weekOffset));

  const { data, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["my-assignments", statusTab],
    queryFn: () => fetchMyAssignments(statusTab),
    enabled: !!currentUser,
  });

  if (userLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-lg border py-12 text-center text-muted-foreground">
        Unable to load user data.
      </div>
    );
  }

  const assignments = data?.assignments ?? [];
  const total = data?.total ?? 0;

  // Stats from "upcoming" if we're in that tab, or all
  const upcomingCount = assignments.filter(
    (a) => a.pipeline !== "completed" && a.scheduledDate
  ).length;
  const thisWeekStart = format(currentWeekStart, "yyyy-MM-dd");
  const thisWeekEnd = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");
  const thisWeekCount = assignments.filter(
    (a) =>
      a.scheduledDate &&
      a.scheduledDate >= thisWeekStart &&
      a.scheduledDate <= thisWeekEnd
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Schedule</h2>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.firstName}. Here are your assignments and availability.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <IconBriefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statusTab === "upcoming" ? upcomingCount : total}</p>
              <p className="text-sm text-muted-foreground">
                {statusTab === "completed" ? "Completed Jobs" : "Active Assignments"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
              <IconCalendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{thisWeekCount}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
              <IconCircleCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {assignments.filter((a) => a.pipeline === "completed").length}
              </p>
              <p className="text-sm text-muted-foreground">Completed (shown)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Weekly View</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <PilotScheduleCalendar
          pilotId={currentUser.id}
          weekStart={currentWeekStart}
        />
      </div>

      {/* My Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
          <CardDescription>Jobs you have been assigned to fly</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as typeof statusTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={statusTab}>
              {assignmentsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {statusTab === "upcoming"
                    ? "No upcoming assignments. Check back after new jobs are scheduled."
                    : statusTab === "completed"
                    ? "No completed jobs yet."
                    : "No assignments found."}
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((job) => {
                    const pipelineColor =
                      PIPELINE_COLORS[job.pipeline ?? ""] ?? "bg-gray-400";
                    return (
                      <Link key={job.id} href={`/workflow/jobs/${job.id}`}>
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                          <div className="flex items-start gap-3">
                            <IconBriefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{job.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <IconMapPin className="h-3 w-3" />
                                <span>{job.siteName}</span>
                                {job.scheduledDate && (
                                  <>
                                    <span>·</span>
                                    <IconClock className="h-3 w-3" />
                                    <span>
                                      {new Date(job.scheduledDate).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={`${pipelineColor} border-none text-white text-xs capitalize`}
                          >
                            {job.pipeline?.replace(/_/g, " ") ?? "Unknown"}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Availability & Blackout Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PilotAvailabilityManager
          pilotId={currentUser.id}
          pilotName={currentUser.fullName || currentUser.firstName}
        />
        <PilotBlackoutManager
          pilotId={currentUser.id}
          pilotName={currentUser.fullName || currentUser.firstName}
        />
      </div>
    </div>
  );
}
