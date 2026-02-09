"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

interface SiteOption { id: number; name: string; }
interface OrgOption { id: number; name: string; }

async function fetchFormData() {
  const [sitesRes, orgsRes] = await Promise.all([
    fetch("/api/workflow/sites"),
    fetch("/api/organizations"),
  ]);
  const sites = sitesRes.ok ? (await sitesRes.json()).data.sites : [];
  const orgs = orgsRes.ok ? (await orgsRes.json()).data.organizations : [];
  return { sites: sites as SiteOption[], organizations: orgs as OrgOption[] };
}

export default function NewJobPage() {
  const { data, isLoading } = useQuery({ queryKey: ["new-job-form"], queryFn: fetchFormData });
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateRequested, setDateRequested] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !siteId || !clientId) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/workflow/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          siteId: parseInt(siteId, 10),
          clientId: parseInt(clientId, 10),
          clientType: "organization",
          dateRequested: dateRequested || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create job");
      }
      setMessage({ type: "success", text: `Job "${name}" created successfully.` });
      setName("");
      setSiteId("");
      setClientId("");
      setDateRequested("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Job</h2>
        <p className="text-muted-foreground">Create a new job entry.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Job Name *</label>
              <Input
                placeholder="Enter job name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Site *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
              >
                <option value="">Select a site...</option>
                {data?.sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Client (Organization) *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Select a client...</option>
                {data?.organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date Requested</label>
              <Input
                type="date"
                value={dateRequested}
                onChange={(e) => setDateRequested(e.target.value)}
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={submitting || !name.trim() || !siteId || !clientId}>
              {submitting ? "Creating..." : "Create Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
