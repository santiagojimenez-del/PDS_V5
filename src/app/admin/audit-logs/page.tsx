"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconClock,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: number;
  action: string;
  resource: string;
  resourceId: number | null;
  userId: number;
  userName: string;
  userEmail: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

async function fetchAuditLogs(page: number, limit: number, action?: string, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(action && action !== "all" && { action }),
    ...(search && { search }),
  });

  const res = await fetch(`/api/admin/audit-logs?${params}`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  const json = await res.json();
  return json.data as { logs: AuditLog[]; total: number };
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, pageSize, actionFilter, search],
    queryFn: () => fetchAuditLogs(page, pageSize, actionFilter, search),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("create")) {
      return <Badge className="bg-green-600">Create</Badge>;
    }
    if (actionLower.includes("update") || actionLower.includes("edit")) {
      return <Badge className="bg-blue-600">Update</Badge>;
    }
    if (actionLower.includes("delete")) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (actionLower.includes("login") || actionLower.includes("auth")) {
      return <Badge className="bg-purple-600">Auth</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-muted-foreground">View all system activity and user actions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login/Auth</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <IconFilter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {data?.total || 0} total entries
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {data?.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getActionBadge(log.action)}
                        <div>
                          <p className="font-medium">
                            {log.action} {log.resource}
                            {log.resourceId && ` #${log.resourceId}`}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconUser className="h-3 w-3" />
                              {log.userName || log.userEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <IconClock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.ipAddress && (
                      <p className="text-xs text-muted-foreground">
                        IP: {log.ipAddress}
                      </p>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Metadata
                        </summary>
                        <pre className="mt-2 rounded bg-muted p-2 text-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {safePage * pageSize + 1}–
                  {Math.min((safePage + 1) * pageSize, data?.total || 0)} of{" "}
                  {data?.total || 0}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {safePage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage(safePage + 1)}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
