"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowLeft,
  IconFileInvoice,
  IconCash,
  IconSend,
  IconTrash,
  IconPlus,
  IconDownload,
} from "@tabler/icons-react";
import Link from "next/link";
import { format } from "date-fns";
import type { InvoiceWithDetails } from "@/modules/billing/types";

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

async function fetchInvoice(id: string): Promise<InvoiceWithDetails> {
  const res = await fetch(`/api/billing/invoices/${id}`);
  if (!res.ok) throw new Error("Invoice not found");
  const json = await res.json();
  return json.data;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = params.id as string;

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  }
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentRef, setPaymentRef] = useState("");

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] }),
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: parseInt(invoiceId),
          amount: parseFloat(paymentAmount),
          paymentMethod,
          paymentDate,
          paymentReference: paymentRef || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentRef("");
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      return res.json();
    },
    onSuccess: () => router.push("/billing"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Link href="/billing">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>
        </Link>
        <p className="text-destructive">Invoice not found.</p>
      </div>
    );
  }

  const canDelete = invoice.status === "draft";
  const canSend = invoice.status === "draft";
  const canRecordPayment = invoice.status === "sent" || invoice.status === "overdue";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing">
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
              <Badge
                className={`${STATUS_COLORS[invoice.status] || "bg-gray-500"} text-white border-none`}
              >
                {STATUS_LABELS[invoice.status] || invoice.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Job #{invoice.jobId} – {invoice.jobName}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            <IconDownload className="mr-2 h-4 w-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
          {canSend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatus.mutate("sent")}
              disabled={updateStatus.isPending}
            >
              <IconSend className="mr-2 h-4 w-4" />
              Mark as Sent
            </Button>
          )}
          {canRecordPayment && (
            <Button
              size="sm"
              onClick={() => setShowPaymentForm(true)}
            >
              <IconCash className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this draft invoice?")) deleteInvoice.mutate();
              }}
              disabled={deleteInvoice.isPending}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Client</p>
            <p className="font-medium">{invoice.clientName}</p>
            <p className="text-sm text-muted-foreground">Job: {invoice.jobName}</p>
            <p className="text-sm text-muted-foreground">Site: {invoice.siteName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dates</p>
            <p className="text-sm">
              <span className="text-muted-foreground">Issued:</span>{" "}
              {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Due:</span>{" "}
              {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
            </p>
            {invoice.paidDate && (
              <p className="text-sm text-green-600">
                <span className="text-muted-foreground">Paid:</span>{" "}
                {format(new Date(invoice.paidDate), "MMM dd, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
            <p className="text-2xl font-bold">${parseFloat(invoice.total).toFixed(2)}</p>
            <p className="text-sm text-green-600">
              Paid: ${parseFloat(invoice.totalPaid).toFixed(2)}
            </p>
            <p className="text-sm text-orange-600 font-medium">
              Due: ${parseFloat(invoice.amountDue).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 text-left font-medium">Description</th>
                <th className="pb-2 text-right font-medium w-20">Qty</th>
                <th className="pb-2 text-right font-medium w-28">Unit Price</th>
                <th className="pb-2 text-right font-medium w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right">${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-muted-foreground">
                <td colSpan={3} className="pt-3 text-right">Subtotal</td>
                <td className="pt-3 text-right">${parseFloat(invoice.subtotal).toFixed(2)}</td>
              </tr>
              {parseFloat(invoice.taxRate) > 0 && (
                <tr className="text-muted-foreground">
                  <td colSpan={3} className="text-right">Tax ({invoice.taxRate}%)</td>
                  <td className="text-right">${parseFloat(invoice.taxAmount).toFixed(2)}</td>
                </tr>
              )}
              <tr className="font-semibold">
                <td colSpan={3} className="pt-2 text-right border-t">Total</td>
                <td className="pt-2 text-right border-t">${parseFloat(invoice.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoice.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">${parseFloat(payment.amount).toFixed(2)}</p>
                  <p className="text-muted-foreground capitalize">
                    {payment.paymentMethod.replace("_", " ")}
                    {payment.paymentReference && ` · Ref: ${payment.paymentReference}`}
                  </p>
                </div>
                <p className="text-muted-foreground">
                  {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Record Payment Form */}
      {showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPlus className="h-5 w-5" />
              Record Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Amount *</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder={invoice.amountDue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Date *</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Method</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reference</label>
              <Input
                placeholder="Transaction ID or check #"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button
                onClick={() => recordPayment.mutate()}
                disabled={recordPayment.isPending || !paymentAmount || !paymentDate}
              >
                {recordPayment.isPending ? "Saving..." : "Record Payment"}
              </Button>
              <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </Button>
            </div>
            {recordPayment.isError && (
              <p className="sm:col-span-2 text-sm text-destructive">
                {(recordPayment.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
