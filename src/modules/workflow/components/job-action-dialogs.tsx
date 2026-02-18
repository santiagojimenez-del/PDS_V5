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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface JobActionDialogsProps {
  jobIds: number[];
  open: string | null; // "approve" | "schedule" | "log-flight" | "deliver" | "bill" | null
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

async function fetchUsers() {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  return json.data.users as User[];
}

export function JobActionDialogs({
  jobIds,
  open,
  onOpenChange,
  onSuccess,
}: JobActionDialogsProps) {
  const [approvedFlight, setApprovedFlight] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledFlight, setScheduledFlight] = useState("");
  const [selectedPersons, setSelectedPersons] = useState<number[]>([]);
  const [flownDate, setFlownDate] = useState("");
  const [flightLog, setFlightLog] = useState("");
  const [deliveredDate, setDeliveredDate] = useState("");
  const [billedDate, setBilledDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: open === "schedule",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0];
      setApprovedFlight(today);
      setScheduledDate(today);
      setScheduledFlight("");
      setSelectedPersons([]);
      setFlownDate(today);
      setFlightLog("");
      setDeliveredDate(today);
      setBilledDate(today);
      setInvoiceNumber("");
    }
  }, [open]);

  const handlePersonToggle = (userId: number) => {
    setSelectedPersons((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleApprove = async () => {
    if (!approvedFlight) {
      toast.error("Approved flight date is required");
      return;
    }

    setSubmitting(true);
    try {
      for (const jobId of jobIds) {
        const res = await fetch(`/api/workflow/jobs/${jobId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedFlight }),
        });
        if (!res.ok) throw new Error("Failed to approve job");
      }
      toast.success(`${jobIds.length} job(s) approved successfully`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve job(s)");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledFlight || selectedPersons.length === 0) {
      toast.error("All fields are required including at least one person");
      return;
    }

    setSubmitting(true);
    try {
      for (const jobId of jobIds) {
        const res = await fetch(`/api/workflow/jobs/${jobId}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledDate,
            scheduledFlight,
            personsAssigned: selectedPersons,
          }),
        });
        if (!res.ok) throw new Error("Failed to schedule job");
      }
      toast.success(`${jobIds.length} job(s) scheduled successfully`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule job(s)");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogFlight = async () => {
    if (!flownDate) {
      toast.error("Flown date is required");
      return;
    }

    setSubmitting(true);
    try {
      const flightLogData = flightLog.trim()
        ? JSON.parse(flightLog)
        : {};

      for (const jobId of jobIds) {
        const res = await fetch(`/api/workflow/jobs/${jobId}/log-flight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flownDate,
            flightLog: flightLogData,
          }),
        });
        if (!res.ok) throw new Error("Failed to log flight");
      }
      toast.success(`${jobIds.length} flight(s) logged successfully`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON in flight log");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to log flight(s)");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliver = async () => {
    setSubmitting(true);
    try {
      for (const jobId of jobIds) {
        const res = await fetch(`/api/workflow/jobs/${jobId}/deliver`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveredDate: deliveredDate || undefined,
          }),
        });
        if (!res.ok) throw new Error("Failed to mark job as delivered");
      }
      toast.success(`${jobIds.length} job(s) marked as delivered`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deliver job(s)");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBill = async () => {
    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return;
    }

    setSubmitting(true);
    try {
      for (const jobId of jobIds) {
        const res = await fetch(`/api/workflow/jobs/${jobId}/bill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billedDate: billedDate || undefined,
            invoiceNumber: invoiceNumber.trim(),
          }),
        });
        if (!res.ok) throw new Error("Failed to bill job");
      }
      toast.success(`${jobIds.length} job(s) billed successfully`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to bill job(s)");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter staff and pilots only
  const staffAndPilots = users?.filter((u) => u.role === "Staff" || u.role === "Pilot") || [];

  return (
    <>
      {/* Approve Dialog */}
      <Dialog open={open === "approve"} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Job</DialogTitle>
            <DialogDescription>
              Set the approved flight date for this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approved-flight">Approved Flight Date *</Label>
              <Input
                id="approved-flight"
                type="date"
                value={approvedFlight}
                onChange={(e) => setApprovedFlight(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={open === "schedule"} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Job</DialogTitle>
            <DialogDescription>
              Set the scheduled date and assign staff/pilots
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Scheduled Date *</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-flight">Scheduled Flight Info *</Label>
              <Input
                id="scheduled-flight"
                placeholder="e.g., 10:00 AM - Sunny conditions"
                value={scheduledFlight}
                onChange={(e) => setScheduledFlight(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Staff/Pilots *</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {staffAndPilots.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPersons.includes(user.id)}
                      onChange={() => handlePersonToggle(user.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {user.name} ({user.role}) - {user.email}
                    </span>
                  </label>
                ))}
              </div>
              {selectedPersons.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  At least one person must be assigned
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSchedule} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Flight Dialog */}
      <Dialog open={open === "log-flight"} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Flight</DialogTitle>
            <DialogDescription>Record flight completion details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flown-date">Flight Date *</Label>
              <Input
                id="flown-date"
                type="date"
                value={flownDate}
                onChange={(e) => setFlownDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flight-log">Flight Log (JSON)</Label>
              <Textarea
                id="flight-log"
                placeholder='{"weather": "Clear", "duration": "45min"}'
                value={flightLog}
                onChange={(e) => setFlightLog(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Optional: Enter JSON data</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleLogFlight} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log Flight
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliver Dialog */}
      <Dialog open={open === "deliver"} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
            <DialogDescription>Record the delivery date</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivered-date">Delivered Date</Label>
              <Input
                id="delivered-date"
                type="date"
                value={deliveredDate}
                onChange={(e) => setDeliveredDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleDeliver} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Mark as Delivered
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={open === "bill"} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bill Job</DialogTitle>
            <DialogDescription>Create an invoice for this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billed-date">Billed Date</Label>
              <Input
                id="billed-date"
                type="date"
                value={billedDate}
                onChange={(e) => setBilledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number *</Label>
              <Input
                id="invoice-number"
                placeholder="INV-2026-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleBill} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Bill Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
