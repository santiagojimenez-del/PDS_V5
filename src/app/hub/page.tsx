import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jobs, sites, organization, users } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBriefcase, IconMapPin, IconBuilding, IconUsers } from "@tabler/icons-react";
import { PIPELINES } from "@/lib/constants";

async function getDashboardStats() {
  const [
    [jobCount],
    [siteCount],
    [orgCount],
    [userCount],
    pipelineCounts,
  ] = await Promise.all([
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(sites),
    db.select({ value: count() }).from(organization),
    db.select({ value: count() }).from(users),
    db
      .select({
        pipeline: jobs.pipeline,
        count: count(),
      })
      .from(jobs)
      .groupBy(jobs.pipeline),
  ]);

  const pipelines: Record<string, number> = {};
  for (const row of pipelineCounts) {
    pipelines[row.pipeline || "unknown"] = row.count;
  }

  return {
    totalJobs: jobCount.value,
    totalSites: siteCount.value,
    totalOrgs: orgCount.value,
    totalUsers: userCount.value,
    pipelines,
  };
}

export default async function HubHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back, {user.firstName}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">Across all pipelines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSites}</div>
            <p className="text-xs text-muted-foreground">Project locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrgs}</div>
            <p className="text-xs text-muted-foreground">Active organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Staff & clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              { key: PIPELINES.BIDS, label: "Bids", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
              { key: PIPELINES.SCHEDULED, label: "Scheduled", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
              { key: PIPELINES.PROCESSING_DELIVER, label: "Processing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
              { key: PIPELINES.BILL, label: "Billing", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
              { key: PIPELINES.COMPLETED, label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
            ].map((stage) => (
              <div
                key={stage.key}
                className={`rounded-lg p-4 text-center ${stage.color}`}
              >
                <div className="text-2xl font-bold">
                  {stats.pipelines[stage.key] || 0}
                </div>
                <div className="text-xs font-medium">{stage.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
