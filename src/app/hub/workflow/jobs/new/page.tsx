"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

interface SiteOption    { id: number; name: string; }
interface OrgOption     { id: number; name: string; }
interface ProductOption { id: number; name: string; }

async function fetchFormData() {
  const [sitesRes, orgsRes, productsRes] = await Promise.all([
    fetch("/api/workflow/sites"),
    fetch("/api/organizations"),
    fetch("/api/products"),
  ]);
  const sites    = sitesRes.ok    ? (await sitesRes.json()).data.sites             : [];
  const orgs     = orgsRes.ok     ? (await orgsRes.json()).data.organizations      : [];
  const products = productsRes.ok ? (await productsRes.json()).data                : [];
  return {
    sites:         sites    as SiteOption[],
    organizations: orgs     as OrgOption[],
    products:      products as ProductOption[],
  };
}

export default function NewJobPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["new-job-form"], queryFn: fetchFormData });

  const [name,            setName]            = useState("");
  const [siteId,          setSiteId]          = useState("");
  const [clientId,        setClientId]        = useState("");
  const [dateRequested,   setDateRequested]   = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [notes,           setNotes]           = useState("");
  const [amountPayable,   setAmountPayable]   = useState("");
  const [submitting,      setSubmitting]      = useState(false);

  const handleProductToggle = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !siteId || !clientId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/workflow/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          name.trim(),
          siteId:        parseInt(siteId, 10),
          clientId:      parseInt(clientId, 10),
          clientType:    "organization",
          dateRequested: dateRequested || null,
          products:      selectedProducts,
          notes:         notes.trim() || undefined,
          amountPayable: amountPayable.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to create job");
        return;
      }

      toast.success(`Job "${name}" created`);
      router.push(`/workflow/jobs/${json.data.id}`);
    } catch {
      toast.error("Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  const canSubmit = name.trim() && siteId && clientId && !submitting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Job</h2>
        <p className="text-muted-foreground">Create a new job and assign it to a site and client.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Job Name */}
            <div className="space-y-1.5">
              <Label htmlFor="job-name">Job Name *</Label>
              <Input
                id="job-name"
                placeholder="Enter job name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Site + Date row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="site">Site *</Label>
                <select
                  id="site"
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
              <div className="space-y-1.5">
                <Label htmlFor="date-requested">Date Requested</Label>
                <Input
                  id="date-requested"
                  type="date"
                  value={dateRequested}
                  onChange={(e) => setDateRequested(e.target.value)}
                />
              </div>
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <Label htmlFor="client">Client (Organization) *</Label>
              <select
                id="client"
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

            {/* Products */}
            {data?.products && data.products.length > 0 && (
              <div className="space-y-1.5">
                <Label>Products</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
                  {data.products.map((product) => (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductToggle(product.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{product.name}</span>
                    </label>
                  ))}
                </div>
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedProducts.map((pid) => {
                      const p = data.products.find((x) => x.id === pid);
                      return p ? (
                        <Badge key={pid} variant="secondary" className="text-xs">
                          {p.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Amount Payable */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount Payable ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountPayable}
                onChange={(e) => setAmountPayable(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={!canSubmit}>
                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Creating..." : "Create Job"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/workflow/jobs")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
