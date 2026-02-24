"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconMapPin,
  IconPencil,
  IconCheck,
  IconX,
  IconTrash,
  IconBriefcase,
  IconAlertTriangle,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { PIPELINES } from "@/lib/constants";

const SiteBoundaryMap = lazy(() =>
  import("@/components/shared/site-boundary-map").then((m) => ({
    default: m.SiteBoundaryMap,
  }))
);

interface SiteJob {
  id: number;
  name: string | null;
  pipeline: string | null;
  dates: Record<string, string> | null;
}

interface SiteDetail {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  coordinates: [number, number] | null;
  boundary: any;
  createdBy: number;
  createdByName: string;
  jobs: SiteJob[];
}

const PIPELINE_COLORS: Record<string, string> = {
  bids: "bg-yellow-500",
  scheduled: "bg-blue-500",
  processing_deliver: "bg-purple-500",
  bill: "bg-orange-500",
  completed: "bg-green-500",
};

async function fetchSite(id: string): Promise<SiteDetail> {
  const res = await fetch(`/api/workflow/sites/${id}`);
  if (!res.ok) throw new Error("Site not found");
  const json = await res.json();
  return json.data;
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.id as string;

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Boundary state (pending save)
  const [pendingBoundary, setPendingBoundary] = useState<any>(undefined);
  const [boundaryDirty, setBoundaryDirty] = useState(false);

  const { data: site, isLoading, error } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => fetchSite(siteId),
  });

  const updateSite = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch(`/api/workflow/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update site");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  const deleteSite = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workflow/sites/${siteId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete site");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      router.push("/workflow/sites");
    },
  });

  function startEdit() {
    if (!site) return;
    setEditName(site.name);
    setEditAddress(site.address || "");
    setEditDescription(site.description || "");
    setEditing(true);
  }

  async function saveInfo() {
    try {
      await updateSite.mutateAsync({
        name: editName.trim(),
        address: editAddress.trim(),
        description: editDescription.trim(),
      });
      setEditing(false);
      toast.success("Site updated");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function saveBoundary() {
    try {
      await updateSite.mutateAsync({ boundary: pendingBoundary ?? null });
      setBoundaryDirty(false);
      setPendingBoundary(undefined);
      toast.success(pendingBoundary ? "Boundary saved" : "Boundary cleared");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function handleBoundaryChange(geojson: any | null) {
    setPendingBoundary(geojson);
    setBoundaryDirty(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="space-y-4">
        <Link href="/workflow/sites">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Sites
          </Button>
        </Link>
        <p className="text-destructive">Site not found.</p>
      </div>
    );
  }

  const activeBoundary = boundaryDirty ? pendingBoundary : site.boundary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workflow/sites">
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Sites
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <IconMapPin className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{site.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {site.jobs.length} job{site.jobs.length !== 1 ? "s" : ""} · Created by{" "}
              {site.createdByName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button variant="outline" size="sm" onClick={startEdit}>
                <IconPencil className="mr-2 h-4 w-4" />
                Edit Info
              </Button>
              {site.jobs.length === 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete site "${site.name}"? This cannot be undone.`))
                      deleteSite.mutate();
                  }}
                  disabled={deleteSite.isPending}
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Address</label>
                <Input
                  placeholder="Address or description of location"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <Input
                  placeholder="Additional notes about this site"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveInfo}
                  disabled={updateSite.isPending || !editName.trim()}
                >
                  <IconCheck className="mr-1.5 h-4 w-4" />
                  {updateSite.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  <IconX className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Address
                </dt>
                <dd className="mt-1 text-sm">
                  {site.address || <span className="text-muted-foreground italic">Not set</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Coordinates
                </dt>
                <dd className="mt-1 text-sm font-mono">
                  {site.coordinates
                    ? `${site.coordinates[0].toFixed(6)}, ${site.coordinates[1].toFixed(6)}`
                    : <span className="text-muted-foreground italic">Not set</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </dt>
                <dd className="mt-1 text-sm">
                  {site.description || (
                    <span className="text-muted-foreground italic">No description</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Boundary
                </dt>
                <dd className="mt-1">
                  {site.boundary ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Defined
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not drawn
                    </Badge>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Map + Boundary Drawing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Site Map & Boundary</CardTitle>
              <CardDescription>
                Draw or edit the site boundary polygon on the map
              </CardDescription>
            </div>
            {boundaryDirty && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <IconAlertTriangle className="h-4 w-4" />
                  Unsaved changes
                </span>
                <Button
                  size="sm"
                  onClick={saveBoundary}
                  disabled={updateSite.isPending}
                >
                  <IconCheck className="mr-1.5 h-4 w-4" />
                  {updateSite.isPending ? "Saving..." : "Save Boundary"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setBoundaryDirty(false);
                    setPendingBoundary(undefined);
                  }}
                >
                  <IconX className="mr-1.5 h-4 w-4" />
                  Discard
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <SiteBoundaryMap
              coordinates={site.coordinates}
              boundary={activeBoundary}
              onBoundaryChange={handleBoundaryChange}
              height="420px"
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Associated Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Associated Jobs</CardTitle>
          <CardDescription>
            {site.jobs.length} job{site.jobs.length !== 1 ? "s" : ""} at this site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {site.jobs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No jobs at this site yet.
            </div>
          ) : (
            <div className="space-y-2">
              {site.jobs.map((job) => {
                const dates = (job.dates as Record<string, string>) || {};
                const pipelineColor =
                  PIPELINE_COLORS[job.pipeline || ""] || "bg-gray-400";

                return (
                  <Link key={job.id} href={`/workflow/jobs/${job.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                      <div className="flex items-center gap-3">
                        <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {job.name || `Job #${job.id}`}
                          </p>
                          {dates.requested && (
                            <p className="text-xs text-muted-foreground">
                              Requested:{" "}
                              {new Date(dates.requested).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`${pipelineColor} text-white border-none capitalize text-xs`}
                      >
                        {job.pipeline?.replace("_", " ") || "unknown"}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
