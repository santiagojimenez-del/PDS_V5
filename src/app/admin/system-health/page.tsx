"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  IconDatabase,
  IconServer,
  IconMail,
  IconClock,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconTool,
  IconLoader2,
} from "@tabler/icons-react";

interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "down";
  checks: HealthCheck[];
  uptime: number;
  timestamp: string;
}

async function fetchSystemHealth() {
  const res = await fetch("/api/admin/system-health");
  if (!res.ok) throw new Error("Failed to fetch system health");
  const json = await res.json();
  return json.data as SystemHealth;
}

export default function SystemHealthPage() {
  const qc = useQueryClient();
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["system-health"],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000,
  });

  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const res = await fetch("/api/admin/maintenance");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as { enabled: boolean };
    },
  });

  const handleMaintenanceToggle = async (enabled: boolean) => {
    setTogglingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to update"); return; }
      toast.success(json.data.message);
      qc.invalidateQueries({ queryKey: ["maintenance-mode"] });
    } catch {
      toast.error("Failed to update maintenance mode");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <IconCheck className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <IconAlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <IconX className="h-5 w-5 text-red-500" />;
      default:
        return <IconAlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case "down":
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">Monitor system status and performance</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">Monitor system status and performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <IconRefresh className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overall Status</CardTitle>
              <CardDescription>
                Last checked: {new Date(data?.timestamp || Date.now()).toLocaleString()}
              </CardDescription>
            </div>
            {getStatusBadge(data?.overall || "unknown")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uptime:</span>
              <span className="font-medium">{formatUptime(data?.uptime || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Checks */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.checks.map((check) => (
          <Card key={check.service}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {check.service === "Database" && <IconDatabase className="h-5 w-5" />}
                  {check.service === "API" && <IconServer className="h-5 w-5" />}
                  {check.service === "Email" && <IconMail className="h-5 w-5" />}
                  <CardTitle className="text-base">{check.service}</CardTitle>
                </div>
                {getStatusIcon(check.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(check.status)}
              </div>
              {check.responseTime !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{check.responseTime}ms</span>
                </div>
              )}
              {check.message && (
                <p className="text-xs text-muted-foreground">{check.message}</p>
              )}
              <div className="text-xs text-muted-foreground">
                Last check: {new Date(check.lastCheck).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconTool className="h-5 w-5 text-primary" />
            <CardTitle>Maintenance Mode</CardTitle>
          </div>
          <CardDescription>
            When enabled, unauthenticated users see a maintenance page.
            Logged-in users can still access the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              {maintenanceLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status</span>
                  {maintenanceData?.enabled ? (
                    <Badge className="bg-orange-500 hover:bg-orange-600">Maintenance Active</Badge>
                  ) : (
                    <Badge variant="secondary">Normal Operation</Badge>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {maintenanceData?.enabled
                  ? "The site is in maintenance mode. Unauthenticated users are redirected."
                  : "The site is operating normally. All users can access it."}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {togglingMaintenance && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Label htmlFor="maintenance-switch" className="text-sm">
                {maintenanceData?.enabled ? "On" : "Off"}
              </Label>
              <Switch
                id="maintenance-switch"
                checked={maintenanceData?.enabled || false}
                onCheckedChange={handleMaintenanceToggle}
                disabled={togglingMaintenance || maintenanceLoading}
                className={maintenanceData?.enabled ? "data-[state=checked]:bg-orange-500" : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Environment and runtime details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Environment</p>
              <p className="text-lg font-semibold">
                {process.env.NODE_ENV === "production" ? "Production" : "Development"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Node Version</p>
              <p className="text-lg font-semibold">{process.version || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next.js Version</p>
              <p className="text-lg font-semibold">16.x</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
