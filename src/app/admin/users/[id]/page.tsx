"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconUser, IconMail, IconPhone, IconShieldCheck, IconBriefcase, IconMapPin, IconArrowLeft,
} from "@tabler/icons-react";
import Link from "next/link";

const ROLE_NAMES: Record<number, string> = {
  0: "Admin", 1: "Client", 3: "Registered", 4: "Developer",
  5: "Staff", 6: "Pilot", 7: "Manager",
};

interface UserDetail {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: number[];
  permissions: string[];
  phoneNumber: string | null;
  twoFactorEnabled: boolean;
  googleAddonLinked: boolean;
  jobsCreated: number;
  sitesCreated: number;
  recentJobs: { id: number; name: string; pipeline: string }[];
  recentSites: { id: number; name: string }[];
}

async function fetchUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  const json = await res.json();
  return json.data as UserDetail;
}

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => fetchUser(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!user) {
    return <p className="py-8 text-center text-muted-foreground">User not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/users/search" className="text-muted-foreground hover:text-foreground">
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{user.fullName || user.email}</h2>
          <p className="text-muted-foreground">User #{user.id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconUser className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phoneNumber && (
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span>2FA: {user.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Google Addon:</span>
              <span>{user.googleAddonLinked ? "Linked" : "Not linked"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <Badge key={r} variant={r === 0 ? "default" : "outline"}>
                  {ROLE_NAMES[r] || `Role ${r}`}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <span className="text-xs text-muted-foreground">No roles assigned</span>
              )}
            </div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Permissions ({user.permissions.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {user.permissions.slice(0, 15).map((p) => (
                <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
              ))}
              {user.permissions.length > 15 && (
                <Badge variant="secondary" className="text-xs">+{user.permissions.length - 15} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBriefcase className="h-4 w-4" /> Jobs Created ({user.jobsCreated})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentJobs.length > 0 ? (
              <div className="space-y-1">
                {user.recentJobs.map((j) => (
                  <div key={j.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{j.name || `Job #${j.id}`}</span>
                    <Badge variant="outline" className="text-xs">{j.pipeline}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No jobs created.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconMapPin className="h-4 w-4" /> Sites Created ({user.sitesCreated})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentSites.length > 0 ? (
              <div className="space-y-1">
                {user.recentSites.map((s) => (
                  <div key={s.id} className="rounded border p-2 text-sm">
                    {s.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sites created.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
