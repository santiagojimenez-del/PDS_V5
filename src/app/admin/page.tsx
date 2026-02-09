import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, jobs, sites, organization, permissions } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconShield, IconBriefcase, IconMapPin, IconBuilding } from "@tabler/icons-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [[userCount], [jobCount], [siteCount], [orgCount], [permCount]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(sites),
    db.select({ value: count() }).from(organization),
    db.select({ value: count() }).from(permissions),
  ]);

  const stats = [
    { label: "Total Users", value: userCount.value, icon: IconUsers, href: "/admin/users/search" },
    { label: "Total Jobs", value: jobCount.value, icon: IconBriefcase, href: null },
    { label: "Total Sites", value: siteCount.value, icon: IconMapPin, href: null },
    { label: "Organizations", value: orgCount.value, icon: IconBuilding, href: null },
    { label: "Permissions", value: permCount.value, icon: IconShield, href: "/admin/users/roles" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground">System administration overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
