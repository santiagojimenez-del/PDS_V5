"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  IconPlus,
  IconTrash,
  IconArrowLeft,
  IconFileInvoice,
} from "@tabler/icons-react";
import Link from "next/link";

interface JobOption {
  id: number;
  name: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

async function fetchJobs(): Promise<JobOption[]> {
  const res = await fetch("/api/workflow/jobs?pipeline=bill");
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data?.jobs || []).map((j: any) => ({ id: j.id, name: j.name || `Job #${j.id}` }));
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: jobs, isLoading } = useQuery({ queryKey: ["jobs-for-invoice"], queryFn: fetchJobs });

  const [jobId, setJobId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * parseFloat(taxRate || "0")) / 100;
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: parseInt(jobId),
          issueDate,
          dueDate,
          taxRate: parseFloat(taxRate || "0"),
          notes: notes || undefined,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create invoice");
      }

      const json = await res.json();
      router.push(`/billing/invoices/${json.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
      <div className="flex items-center gap-4">
        <Link href="/billing">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">New Invoice</h2>
          <p className="text-sm text-muted-foreground">Create a new invoice for a job</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job & Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileInvoice className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Job *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                required
              >
                <option value="">Select a job in billing stage...</option>
                {jobs?.map((j) => (
                  <option key={j.id} value={j.id}>
                    #{j.id} – {j.name}
                  </option>
                ))}
              </select>
              {jobs?.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No jobs in billing stage. Advance a job to the billing stage first.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Issue Date *</label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due Date *</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <IconPlus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  {index === 0 && (
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Description *
                    </label>
                  )}
                  <Input
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && (
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Qty *
                    </label>
                  )}
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="col-span-3">
                  {index === 0 && (
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Unit Price *
                    </label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                    }
                    required
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {parseFloat(taxRate || "0") > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Optional notes for this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting || !jobId || lineItems.some((i) => !i.description)}
          >
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
          <Link href="/billing">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
