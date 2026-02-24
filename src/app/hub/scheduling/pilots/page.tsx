"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconUser, IconCalendar, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { ROLES } from "@/lib/constants";

interface PilotUser {
  id: number;
  fullName: string;
  email: string;
  roles: number[];
}

async function fetchPilots() {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  const users = json.data.users as PilotUser[];
  return users.filter(
    (u) => u.roles.includes(ROLES.PILOT) || u.roles.includes(ROLES.STAFF)
  );
}

function pilotRoleLabel(roles: number[]): string {
  if (roles.includes(ROLES.PILOT)) return "Pilot";
  if (roles.includes(ROLES.STAFF)) return "Staff";
  return "Unknown";
}

export default function PilotsListPage() {
  const { data: pilots, isLoading } = useQuery({
    queryKey: ["pilots"],
    queryFn: fetchPilots,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Pilot Scheduling</h2>
          <p className="text-muted-foreground">Manage pilot availability and schedules</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Pilot Scheduling</h2>
        <p className="text-muted-foreground">
          Manage pilot availability and schedules
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <IconUser className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pilots?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Pilots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <IconCalendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {pilots?.filter((p) => p.roles.includes(ROLES.PILOT)).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Pilots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <IconUser className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {pilots?.filter((p) => p.roles.includes(ROLES.STAFF)).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Staff Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pilots List */}
      {pilots && pilots.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pilots.map((pilot) => (
            <Link key={pilot.id} href={`/scheduling/pilots/${pilot.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <IconUser className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{pilot.fullName || pilot.email}</p>
                        <p className="text-xs text-muted-foreground">{pilot.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pilot.roles.includes(ROLES.PILOT) ? "default" : "secondary"}>
                        {pilotRoleLabel(pilot.roles)}
                      </Badge>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <IconUser className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No pilots or staff found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
