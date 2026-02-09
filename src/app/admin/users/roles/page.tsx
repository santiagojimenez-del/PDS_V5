"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconShield, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";

interface PermissionData {
  name: string;
  category: string | null;
  label: string | null;
  description: string | null;
  priority: number;
  hidden: boolean;
  enforce: boolean;
}

async function fetchPermissions() {
  const res = await fetch("/api/admin/permissions");
  if (!res.ok) throw new Error("Failed to fetch permissions");
  const json = await res.json();
  return json.data as {
    permissions: PermissionData[];
    categories: Record<string, PermissionData[]>;
    total: number;
  };
}

export default function RolesAndPermissionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["permissions"], queryFn: fetchPermissions });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Roles & Permissions</h2>
        <p className="text-muted-foreground">
          {data?.total || 0} permissions configured across the system.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { id: 0, name: "Admin", desc: "Full system access" },
          { id: 1, name: "Client", desc: "Client portal access" },
          { id: 5, name: "Staff", desc: "Hub workflow access" },
          { id: 6, name: "Pilot", desc: "Flight operations" },
          { id: 7, name: "Manager", desc: "Team management" },
          { id: 3, name: "Registered", desc: "Base registered user" },
          { id: 4, name: "Developer", desc: "Developer tools access" },
        ].map((role) => (
          <Card key={role.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <IconShield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{role.name}</p>
                <p className="text-xs text-muted-foreground">{role.desc}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs">
                ID: {role.id}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data && Object.entries(data.categories).map(([category, perms]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconLock className="h-4 w-4" />
                  {category}
                  <Badge variant="secondary" className="text-xs">{perms.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {perms.map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.label || p.name}</span>
                          {p.hidden ? (
                            <IconEyeOff className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <IconEye className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={p.enforce ? "default" : "secondary"} className="text-xs">
                          {p.enforce ? "Enforced" : "Not Enforced"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          P{p.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
