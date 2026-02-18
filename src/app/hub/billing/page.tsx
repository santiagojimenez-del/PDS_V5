"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconFileInvoice,
  IconCash,
  IconClock,
  IconAlertCircle,
  IconPlus,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { format } from "date-fns";
import type { InvoiceSummary } from "@/modules/billing/types";

interface Invoice {
  id: number;
  invoiceNumber: string;
  jobId: number;
  total: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;
}

async function fetchInvoices() {
  const res = await fetch("/api/billing/invoices");
  if (!res.ok) throw new Error("Failed to fetch invoices");
  const json = await res.json();
  return json.data.invoices as Invoice[];
}

async function fetchSummary() {
  const res = await fetch("/api/billing/summary");
  if (!res.ok) throw new Error("Failed to fetch summary");
  const json = await res.json();
  return json.data as InvoiceSummary;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  cancelled: "bg-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export default function BillingDashboardPage() {
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["billing-summary"],
    queryFn: fetchSummary,
  });

  if (invoicesLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Manage invoices and track payments
          </p>
        </div>
        <Link href="/billing/invoices/new">
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <IconFileInvoice className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${summary?.totalBilled.toFixed(0) || 0}</p>
                <p className="text-sm text-muted-foreground">Total Billed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <IconCash className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${summary?.totalPaid.toFixed(0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <IconClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  ${summary?.totalOutstanding.toFixed(0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <IconAlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {summary?.overdueCount || 0}
                </p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            {invoices?.length || 0} total invoice(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.slice(0, 20).map((invoice) => (
                <Link key={invoice.id} href={`/billing/invoices/${invoice.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <IconFileInvoice className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Job #{invoice.jobId} • Issued {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">${parseFloat(invoice.total).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {format(new Date(invoice.dueDate), "MMM dd")}
                        </p>
                      </div>
                      <Badge
                        className={`${STATUS_COLORS[invoice.status] || "bg-gray-500"} text-white border-none`}
                      >
                        {STATUS_LABELS[invoice.status] || invoice.status}
                      </Badge>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <IconFileInvoice className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No invoices yet</p>
              <Link href="/billing/invoices/new">
                <Button variant="outline" className="mt-4">
                  Create First Invoice
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
