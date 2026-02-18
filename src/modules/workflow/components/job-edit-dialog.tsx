"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface JobEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  initialData: {
    name: string;
    siteId: number | null;
    clientId: number | null;
    clientType: "organization" | "user";
    products: number[];
    notes: string;
    amountPayable: string;
  };
  onSuccess?: () => void;
}

interface SiteOption {
  id: number;
  name: string;
}

interface OrgOption {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
}

async function fetchFormData() {
  const [sitesRes, orgsRes, productsRes] = await Promise.all([
    fetch("/api/workflow/sites"),
    fetch("/api/organizations"),
    fetch("/api/products"),
  ]);
  const sites = sitesRes.ok ? (await sitesRes.json()).data.sites : [];
  const orgs = orgsRes.ok ? (await orgsRes.json()).data.organizations : [];
  const products = productsRes.ok ? (await productsRes.json()).data : [];
  return {
    sites: sites as SiteOption[],
    organizations: orgs as OrgOption[],
    products: products as ProductOption[],
  };
}

export function JobEditDialog({
  open,
  onOpenChange,
  jobId,
  initialData,
  onSuccess,
}: JobEditDialogProps) {
  const [name, setName] = useState(initialData.name);
  const [siteId, setSiteId] = useState(initialData.siteId?.toString() || "");
  const [clientId, setClientId] = useState(initialData.clientId?.toString() || "");
  const [clientType, setClientType] = useState<"organization" | "user">(initialData.clientType);
  const [selectedProducts, setSelectedProducts] = useState<number[]>(initialData.products);
  const [notes, setNotes] = useState(initialData.notes);
  const [amountPayable, setAmountPayable] = useState(initialData.amountPayable);
  const [submitting, setSubmitting] = useState(false);

  const { data: formData, isLoading } = useQuery({
    queryKey: ["job-edit-form-data"],
    queryFn: fetchFormData,
    enabled: open,
  });

  // Reset form when initialData changes
  useEffect(() => {
    setName(initialData.name);
    setSiteId(initialData.siteId?.toString() || "");
    setClientId(initialData.clientId?.toString() || "");
    setClientType(initialData.clientType);
    setSelectedProducts(initialData.products);
    setNotes(initialData.notes);
    setAmountPayable(initialData.amountPayable);
  }, [initialData, open]);

  const handleProductToggle = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Job name is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/workflow/jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          siteId: siteId ? parseInt(siteId, 10) : undefined,
          clientId: clientId ? parseInt(clientId, 10) : undefined,
          clientType,
          products: selectedProducts,
          notes: notes.trim() || undefined,
          amountPayable: amountPayable.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update job");
      }

      toast.success("Job updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>Update job details and settings</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Job Name *</Label>
              <Input
                id="name"
                placeholder="Enter job name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Site */}
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger id="site">
                  <SelectValue placeholder="Select a site..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {formData?.sites.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client ({clientType})</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {formData?.organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products */}
            <div className="space-y-2">
              <Label>Products</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {formData?.products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 cursor-pointer"
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
            </div>

            {/* Amount Payable */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Payable</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountPayable}
                onChange={(e) => setAmountPayable(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
