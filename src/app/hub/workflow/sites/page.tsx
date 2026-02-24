"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconMapPin,
  IconBriefcase,
  IconSearch,
  IconMap,
  IconList,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconDownload,
} from "@tabler/icons-react";
import { useState, useMemo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useHasPermission } from "@/modules/permissions/hooks/use-permissions";

const SitesMap = lazy(() =>
  import("@/components/shared/sites-map").then((m) => ({ default: m.SitesMap }))
);

interface SiteData {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  coordinates: [number, number] | null;
  boundary: [number, number][] | null;
  createdBy: string;
  jobCount: number;
}

async function fetchSites() {
  const res = await fetch("/api/workflow/sites");
  if (!res.ok) throw new Error("Failed to fetch sites");
  const json = await res.json();
  return json.data as { sites: SiteData[]; total: number };
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function SitesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading } = useQuery({ queryKey: ["sites"], queryFn: fetchSites });
  const queryClient = useQueryClient();

  // User permissions
  const { data: userData } = useCurrentUser();
  const currentUser = userData?.data?.user ?? null;
  const canCreateSite = useHasPermission(currentUser, "create_project_site");

  // New Site dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", description: "", lat: "", lng: "" });

  function resetForm() {
    setForm({ name: "", address: "", description: "", lat: "", lng: "" });
    setFormError("");
  }

  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setFormError("Latitude and Longitude must be valid numbers.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/workflow/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          description: form.description.trim() || undefined,
          lat,
          lng,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to create site.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setDialogOpen(false);
      resetForm();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExport() {
    try {
      const response = await fetch("/api/workflow/sites/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sites_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export sites:", error);
    }
  }

  const filtered = useMemo(() =>
    data?.sites.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
    ) || [],
    [data?.sites, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedSites = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Sites</h2>
          <p className="text-muted-foreground">{data?.total || 0} project sites registered.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <IconDownload className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
          {canCreateSite && (
            <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <IconPlus className="mr-1.5 h-4 w-4" /> New Site
            </Button>
          )}
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8 px-3"
            >
              <IconList className="mr-1.5 h-4 w-4" /> List
            </Button>
            <Button
              variant={view === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("map")}
              className="h-8 px-3"
            >
              <IconMap className="mr-1.5 h-4 w-4" /> Map
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sites..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        {view === "list" && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} site{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : view === "map" ? (
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
            <SitesMap
              sites={filtered}
              selectedSiteId={selectedSiteId}
              onSiteClick={(id) => setSelectedSiteId(id === selectedSiteId ? null : id)}
              className="h-[500px] w-full rounded-lg border"
            />
          </Suspense>
          {selectedSiteId && (() => {
            const site = filtered.find((s) => s.id === selectedSiteId);
            if (!site) return null;
            return (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{site.name}</h3>
                      {site.address && <p className="text-sm text-muted-foreground">{site.address}</p>}
                      {site.description && <p className="mt-1 text-sm">{site.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">Created by {site.createdBy}</p>
                    </div>
                    <Badge variant="outline">
                      <IconBriefcase className="mr-1 h-3 w-3" />
                      {site.jobCount} jobs
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-lg border py-12 text-center">
              <p className="text-muted-foreground">
                {search ? "No sites match your search." : "No sites found."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {paginatedSites.map((site) => (
                  <Card
                    key={site.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => router.push(`/workflow/sites/${site.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconMapPin className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">{site.name}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <IconBriefcase className="mr-1 h-3 w-3" />
                          {site.jobCount}
                        </Badge>
                      </div>
                      {site.address && (
                        <p className="mb-1 text-xs text-muted-foreground line-clamp-2">{site.address}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Created by {site.createdBy}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                    className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
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
        </>
      )}

      {/* New Site Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Site</DialogTitle>
            <DialogDescription>Add a new project site with its location coordinates.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Name *</Label>
              <Input
                id="site-name"
                placeholder="Site name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-address">Address</Label>
              <Input
                id="site-address"
                placeholder="Address (optional)"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-description">Description</Label>
              <Input
                id="site-description"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="site-lat">Latitude *</Label>
                <Input
                  id="site-lat"
                  type="number"
                  step="any"
                  placeholder="e.g. 25.7617"
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-lng">Longitude *</Label>
                <Input
                  id="site-lng"
                  type="number"
                  step="any"
                  placeholder="e.g. -80.1918"
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  required
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Site"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
