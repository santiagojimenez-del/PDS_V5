"use client";

/**
 * Admin — Active Connections Monitor
 * /admin/developer/active-visitors
 *
 * Two panels:
 *  1. Live Socket.IO connections (real-time via socket event admin:developer:connections:update)
 *  2. HTTP sessions with valid tokens (from /api/admin/sessions — refreshes every 30s)
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconNetwork, IconUser, IconClock, IconRefresh,
  IconPlugConnected, IconPlugConnectedX, IconDoor, IconLogout, IconLoader2,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SocketConnection {
  socketId: string;
  userId: number;
  email: string;
  fullName: string;
  roles: number[];
  connectedAt: number; // timestamp ms
  rooms: string[];
}

interface HttpSession {
  userId: number;
  email: string;
  fullName: string;
  roles: number[];
  sessionCount: number;
}

const ROLE_NAMES: Record<number, string> = {
  0: "Admin", 1: "Client", 3: "Registered", 4: "Developer",
  5: "Staff", 6: "Pilot", 7: "Manager",
};

function roleName(r: number) {
  return ROLE_NAMES[r] || `Role ${r}`;
}

function elapsed(connectedAt: number): string {
  const secs = Math.floor((Date.now() - connectedAt) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActiveVisitorsPage() {
  const [socketConns,   setSocketConns]   = useState<SocketConnection[]>([]);
  const [socketStatus,  setSocketStatus]  = useState<"connecting" | "live" | "error">("connecting");
  const [tick,          setTick]          = useState(0); // forces re-render for elapsed times
  const [killing,       setKilling]       = useState<number | null>(null);

  // HTTP sessions (fallback / extra info)
  const { data: httpData, isLoading: httpLoading, refetch: refetchHttp } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sessions");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as { sessions: HttpSession[]; total: number };
    },
    refetchInterval: 30000,
  });

  // Socket.IO — request connections on mount, listen for updates
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setSocketStatus("live");
      socket.emit("admin:developer:connections");
    };

    const onUpdate = (data: { connections: SocketConnection[] }) => {
      setSocketConns(data.connections);
      setSocketStatus("live");
    };

    const onDisconnect = () => setSocketStatus("error");

    socket.on("connect",                          onConnect);
    socket.on("admin:developer:connections:update", onUpdate);
    socket.on("disconnect",                       onDisconnect);

    if (socket.connected) {
      setSocketStatus("live");
      socket.emit("admin:developer:connections");
    }

    // Refresh elapsed times every 5s
    const interval = setInterval(() => setTick((t) => t + 1), 5000);

    return () => {
      socket.off("connect",                          onConnect);
      socket.off("admin:developer:connections:update", onUpdate);
      socket.off("disconnect",                       onDisconnect);
      clearInterval(interval);
    };
  }, []);

  const requestRefresh = useCallback(() => {
    const socket = getSocket();
    socket.emit("admin:developer:connections");
    refetchHttp();
  }, [refetchHttp]);

  const handleKillSessions = async (userId: number, email: string) => {
    setKilling(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kill-sessions" }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to kill sessions"); return; }
      toast.success(`Sessions terminated for ${email}`);
      refetchHttp();
    } catch {
      toast.error("Failed to kill sessions");
    } finally {
      setKilling(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Active Connections</h2>
          <p className="text-muted-foreground text-sm">
            Real-time socket connections and HTTP sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {socketStatus === "live" ? (
              <><IconPlugConnected className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">Socket Live</span></>
            ) : socketStatus === "connecting" ? (
              <><IconNetwork className="h-4 w-4 animate-pulse text-yellow-500" />
                <span className="text-yellow-600">Connecting…</span></>
            ) : (
              <><IconPlugConnectedX className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Disconnected</span></>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={requestRefresh} className="gap-1">
            <IconRefresh className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Socket Connections ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Live Socket Connections</h3>
          <Badge variant="secondary">{socketConns.length}</Badge>
        </div>

        {socketConns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <IconNetwork className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {socketStatus === "connecting" ? "Waiting for socket connection…" : "No active socket connections."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {socketConns.map((c) => (
              <Card key={c.socketId}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                        <IconUser className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.fullName || c.email}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          socket: {c.socketId.slice(0, 12)}…
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {c.roles.map((r) => (
                          <Badge key={r} variant={r === 0 ? "default" : "outline"} className="text-xs">
                            {roleName(r)}
                          </Badge>
                        ))}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        {elapsed(c.connectedAt)}
                      </span>
                    </div>
                  </div>
                  {c.rooms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.rooms.map((room) => (
                        <Badge key={room} variant="secondary" className="text-xs gap-1">
                          <IconDoor className="h-3 w-3" />
                          {room}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ── HTTP Sessions ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">HTTP Sessions (valid tokens)</h3>
          <Badge variant="secondary">{httpData?.total || 0}</Badge>
          <span className="text-xs text-muted-foreground">auto-refresh 30s</span>
        </div>

        {httpLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (httpData?.sessions.length || 0) === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">No active HTTP sessions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {httpData!.sessions.map((s) => (
              <Card key={s.userId}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <IconUser className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{s.fullName || s.email}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.roles.map((r) => (
                      <Badge key={r} variant={r === 0 ? "default" : "outline"} className="text-xs">
                        {roleName(r)}
                      </Badge>
                    ))}
                    <Badge variant="secondary" className="text-xs">
                      <IconClock className="mr-1 h-3 w-3" />
                      {s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={killing === s.userId}
                      onClick={() => handleKillSessions(s.userId, s.email)}
                      title="Kill all sessions"
                    >
                      {killing === s.userId
                        ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                        : <IconLogout className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
