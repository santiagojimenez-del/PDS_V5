"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconLoader2 } from "@tabler/icons-react";

interface BulkDialogProps {
  open: boolean;
  onClose: () => void;
  selectedJobs: Set<number>;
  clearSelection: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function JobsSummary({ jobIds }: { jobIds: number[] }) {
  const display = jobIds.slice(0, 10);
  const remaining = jobIds.length - display.length;
  return (
    <p className="text-sm text-muted-foreground">
      Jobs: {display.map((id) => `#${id}`).join(", ")}
      {remaining > 0 && ` and ${remaining} more`}
    </p>
  );
}

async function submitBulk(
  url: string,
  payload: Record<string, unknown>,
  actionLabel: string,
  queryClient: ReturnType<typeof useQueryClient>,
  clearSelection: () => void,
  onClose: () => void,
  setSubmitting: (v: boolean) => void
) {
  setSubmitting(true);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || `Failed to ${actionLabel}`);
      return;
    }

    const { succeeded, failed } = json.data;
    if (failed === 0) {
      toast.success(`${succeeded} job${succeeded !== 1 ? "s" : ""} ${actionLabel} successfully`);
    } else {
      toast.warning(`${succeeded} succeeded, ${failed} failed`);
    }

    queryClient.invalidateQueries({ queryKey: ["workflow-jobs"] });
    clearSelection();
    onClose();
  } catch {
    toast.error("Network error");
  } finally {
    setSubmitting(false);
  }
}

// ── Approve Dialog ──────────────────────────────────────────────────────────
export function BulkApproveDialog({ open, onClose, selectedJobs, clearSelection }: BulkDialogProps) {
  const queryClient = useQueryClient();
  const [approvedFlight, setApprovedFlight] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const jobIds = [...selectedJobs];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve {jobIds.length} Job{jobIds.length !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>Set the approved flight date for the selected jobs.</DialogDescription>
        </DialogHeader>
        <JobsSummary jobIds={jobIds} />
        <div className="space-y-2">
          <Label htmlFor="approvedFlight">Approved Flight Date</Label>
          <Input
            id="approvedFlight"
            type="date"
            value={approvedFlight}
            onChange={(e) => setApprovedFlight(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!approvedFlight || submitting}
            onClick={() =>
              submitBulk(
                "/api/workflow/bulk/approve",
                { jobIds, approvedFlight },
                "approved",
                queryClient,
                clearSelection,
                onClose,
                setSubmitting
              )
            }
          >
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Schedule Dialog ─────────────────────────────────────────────────────────
export function BulkScheduleDialog({ open, onClose, selectedJobs, clearSelection }: BulkDialogProps) {
  const queryClient = useQueryClient();
  const [scheduledDate, setScheduledDate] = useState(todayISO());
  const [scheduledFlight, setScheduledFlight] = useState(todayISO());
  const [personsAssigned, setPersonsAssigned] = useState<number[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const jobIds = [...selectedJobs];

  // Fetch pilot/staff users when dialog opens
  const fetchUsers = async () => {
    if (users.length > 0) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        // Filter for pilots and staff
        const filtered = (json.data || []).filter(
          (u: { roles?: number[] }) =>
            u.roles?.includes(5) || u.roles?.includes(6) // Staff=5, Pilot=6
        );
        setUsers(
          filtered.map((u: { id: number; firstName?: string; lastName?: string; email?: string }) => ({
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || `User #${u.id}`,
          }))
        );
      }
    } catch {
      // silently fail - user can still submit without persons
    } finally {
      setLoadingUsers(false);
    }
  };

  const togglePerson = (id: number) => {
    setPersonsAssigned((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) fetchUsers();
        else onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule {jobIds.length} Job{jobIds.length !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>Set the schedule dates and assign persons.</DialogDescription>
        </DialogHeader>
        <JobsSummary jobIds={jobIds} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledFlight">Scheduled Flight</Label>
            <Input
              id="scheduledFlight"
              type="date"
              value={scheduledFlight}
              onChange={(e) => setScheduledFlight(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Persons Assigned</Label>
          {loadingUsers ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pilots/staff found</p>
          ) : (
            <div className="flex flex-wrap gap-2 rounded-md border p-2 max-h-32 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => togglePerson(u.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    personsAssigned.includes(u.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!scheduledDate || !scheduledFlight || submitting}
            onClick={() =>
              submitBulk(
                "/api/workflow/bulk/schedule",
                { jobIds, scheduledDate, scheduledFlight, personsAssigned },
                "scheduled",
                queryClient,
                clearSelection,
                onClose,
                setSubmitting
              )
            }
          >
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Flight Log Dialog ───────────────────────────────────────────────────────
export function BulkFlightLogDialog({ open, onClose, selectedJobs, clearSelection }: BulkDialogProps) {
  const queryClient = useQueryClient();
  const [flownDate, setFlownDate] = useState(todayISO());
  const [flightLogText, setFlightLogText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const jobIds = [...selectedJobs];

  const handleSubmit = () => {
    let flightLog: Record<string, unknown> | undefined;
    if (flightLogText.trim()) {
      try {
        flightLog = JSON.parse(flightLogText);
      } catch {
        toast.error("Invalid JSON in flight log");
        return;
      }
    }
    submitBulk(
      "/api/workflow/bulk/flight-log",
      { jobIds, flownDate, ...(flightLog ? { flightLog } : {}) },
      "logged",
      queryClient,
      clearSelection,
      onClose,
      setSubmitting
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Flight for {jobIds.length} Job{jobIds.length !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>Record the flight date and optional flight log data.</DialogDescription>
        </DialogHeader>
        <JobsSummary jobIds={jobIds} />
        <div className="space-y-2">
          <Label htmlFor="flownDate">Flown Date</Label>
          <Input
            id="flownDate"
            type="date"
            value={flownDate}
            onChange={(e) => setFlownDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="flightLog">Flight Log (optional JSON)</Label>
          <textarea
            id="flightLog"
            rows={3}
            placeholder='{"notes": "..."}'
            value={flightLogText}
            onChange={(e) => setFlightLogText(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button disabled={!flownDate || submitting} onClick={handleSubmit}>
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Flight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Deliver Dialog ──────────────────────────────────────────────────────────
export function BulkDeliverDialog({ open, onClose, selectedJobs, clearSelection }: BulkDialogProps) {
  const queryClient = useQueryClient();
  const [deliveredDate, setDeliveredDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const jobIds = [...selectedJobs];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deliver {jobIds.length} Job{jobIds.length !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>Mark the selected jobs as delivered.</DialogDescription>
        </DialogHeader>
        <JobsSummary jobIds={jobIds} />
        <div className="space-y-2">
          <Label htmlFor="deliveredDate">Delivered Date</Label>
          <Input
            id="deliveredDate"
            type="date"
            value={deliveredDate}
            onChange={(e) => setDeliveredDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() =>
              submitBulk(
                "/api/workflow/bulk/deliver",
                { jobIds, deliveredDate },
                "delivered",
                queryClient,
                clearSelection,
                onClose,
                setSubmitting
              )
            }
          >
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deliver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Bill Dialog ─────────────────────────────────────────────────────────────
export function BulkBillDialog({ open, onClose, selectedJobs, clearSelection }: BulkDialogProps) {
  const queryClient = useQueryClient();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billedDate, setBilledDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const jobIds = [...selectedJobs];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bill {jobIds.length} Job{jobIds.length !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>Enter invoice details for the selected jobs.</DialogDescription>
        </DialogHeader>
        <JobsSummary jobIds={jobIds} />
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            placeholder="INV-001"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billedDate">Billed Date</Label>
          <Input
            id="billedDate"
            type="date"
            value={billedDate}
            onChange={(e) => setBilledDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!invoiceNumber.trim() || submitting}
            onClick={() =>
              submitBulk(
                "/api/workflow/bulk/bill",
                { jobIds, invoiceNumber: invoiceNumber.trim(), billedDate },
                "billed",
                queryClient,
                clearSelection,
                onClose,
                setSubmitting
              )
            }
          >
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Dialog ───────────────────────────────────────────────────────────
export function BulkDeleteDialog({ open, onClose, selectedJobs, clearSelection }: BulkDialogProps) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const jobIds = [...selectedJobs];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {jobIds.length} Job{jobIds.length !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription className="text-destructive">
            This action cannot be undone. The selected jobs and all their metadata will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <JobsSummary jobIds={jobIds} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={submitting}
            onClick={() =>
              submitBulk(
                "/api/workflow/bulk/delete",
                { jobIds },
                "deleted",
                queryClient,
                clearSelection,
                onClose,
                setSubmitting
              )
            }
          >
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
