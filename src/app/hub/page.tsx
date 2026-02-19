import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jobs, sites, organization, users } from "@/lib/db/schema";
import { eq, count, sql, and, gte } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  IconBriefcase,
  IconMapPin,
  IconBuilding,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconCircleCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { PIPELINES } from "@/lib/constants";
import Link from "next/link";

async function getDashboardStats() {
  // Get current date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    [jobCount],
    [siteCount],
    [orgCount],
    [userCount],
    pipelineCounts,
    [recentJobs],
    [completedThisMonth],
    [completedLastMonth],
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
    db
      .select({ value: count() })
      .from(jobs)
      .where(gte(jobs.createdAt, sevenDaysAgo)),
    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.pipeline, PIPELINES.COMPLETED),
          gte(jobs.dateCompleted, thirtyDaysAgo)
        )
      ),
    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.pipeline, PIPELINES.COMPLETED),
          sql`${jobs.dateCompleted} < ${thirtyDaysAgo}`
        )
      ),
  ]);

  const pipelines: Record<string, number> = {};
  for (const row of pipelineCounts) {
    pipelines[row.pipeline || "unknown"] = row.count;
  }

  // Calculate growth rate
  const growthRate =
    completedLastMonth.value > 0
      ? ((completedThisMonth.value - completedLastMonth.value) /
          completedLastMonth.value) *
        100
      : completedThisMonth.value > 0
      ? 100
      : 0;

  return {
    totalJobs: jobCount.value,
    totalSites: siteCount.value,
    totalOrgs: orgCount.value,
    totalUsers: userCount.value,
    pipelines,
    recentJobs: recentJobs.value,
    completedThisMonth: completedThisMonth.value,
    growthRate: Math.round(growthRate),
  };
}

async function getRecentActivity() {
  const recentJobs = await db
    .select({
      id: jobs.id,
      name: jobs.name,
      pipeline: jobs.pipeline,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .orderBy(sql`${jobs.createdAt} DESC`)
    .limit(5);

  return recentJobs;
}

export default async function HubHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  const totalInProgress =
    (stats.pipelines[PIPELINES.BIDS] || 0) +
    (stats.pipelines[PIPELINES.SCHEDULED] || 0) +
    (stats.pipelines[PIPELINES.PROCESSING_DELIVER] || 0);

  const completionRate =
    stats.totalJobs > 0
      ? ((stats.pipelines[PIPELINES.COMPLETED] || 0) / stats.totalJobs) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {user.firstName}</h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your operations.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentJobs} new this week
            </p>
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
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
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

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">
                {stats.completedThisMonth}
              </div>
              <div
                className={`mb-1 flex items-center gap-1 text-sm font-medium ${
                  stats.growthRate >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.growthRate >= 0 ? (
                  <IconTrendingUp className="h-4 w-4" />
                ) : (
                  <IconTrendingDown className="h-4 w-4" />
                )}
                {Math.abs(stats.growthRate)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground">vs. last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInProgress}</div>
            <p className="text-xs text-muted-foreground">
              Active jobs in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completionRate.toFixed(0)}%
            </div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Jobs distribution across pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                key: PIPELINES.BIDS,
                label: "Bids",
                icon: IconAlertTriangle,
                color: "bg-yellow-500",
              },
              {
                key: PIPELINES.SCHEDULED,
                label: "Scheduled",
                icon: IconClock,
                color: "bg-blue-500",
              },
              {
                key: PIPELINES.PROCESSING_DELIVER,
                label: "Processing & Delivery",
                icon: IconBriefcase,
                color: "bg-purple-500",
              },
              {
                key: PIPELINES.BILL,
                label: "Billing",
                icon: IconTrendingUp,
                color: "bg-orange-500",
              },
              {
                key: PIPELINES.COMPLETED,
                label: "Completed",
                icon: IconCircleCheck,
                color: "bg-green-500",
              },
            ].map((stage) => {
              const count = stats.pipelines[stage.key] || 0;
              const percentage =
                stats.totalJobs > 0 ? (count / stats.totalJobs) * 100 : 0;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex items-center gap-4">
                  <div className="flex w-40 items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="flex-1" />
                      <span className="w-12 text-right text-sm font-medium">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest jobs created</CardDescription>
            </div>
            <Link
              href="/workflow/jobs"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{job.name || `Job #${job.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{job.pipeline}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
