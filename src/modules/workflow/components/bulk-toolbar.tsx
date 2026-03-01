"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconCheck,
  IconCalendar,
  IconFileText,
  IconSend,
  IconCash,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { PIPELINES } from "@/lib/constants";
import {
  BulkApproveDialog,
  BulkScheduleDialog,
  BulkFlightLogDialog,
  BulkDeliverDialog,
  BulkBillDialog,
  BulkDeleteDialog,
} from "./bulk-dialogs";

interface BulkToolbarProps {
  selectedJobs: Set<number>;
  activeTab: string;
  clearSelection: () => void;
  bottomOffset?: string; // e.g. "bottom-20" to stack above another toolbar
}

type DialogType = "approve" | "schedule" | "flight-log" | "deliver" | "bill" | "delete" | null;

const ACTIONS_BY_PIPELINE: Record<string, { key: DialogType; label: string; icon: typeof IconCheck; variant?: "destructive" }[]> = {
  [PIPELINES.BIDS]: [
    { key: "approve", label: "Approve", icon: IconCheck },
    { key: "delete", label: "Delete", icon: IconTrash, variant: "destructive" },
  ],
  [PIPELINES.SCHEDULED]: [
    { key: "flight-log", label: "Log Flight", icon: IconFileText },
    { key: "delete", label: "Delete", icon: IconTrash, variant: "destructive" },
  ],
  [PIPELINES.PROCESSING_DELIVER]: [
    { key: "deliver", label: "Deliver", icon: IconSend },
    { key: "delete", label: "Delete", icon: IconTrash, variant: "destructive" },
  ],
  [PIPELINES.BILL]: [
    { key: "bill", label: "Bill", icon: IconCash },
    { key: "delete", label: "Delete", icon: IconTrash, variant: "destructive" },
  ],
  [PIPELINES.COMPLETED]: [
    { key: "delete", label: "Delete", icon: IconTrash, variant: "destructive" },
  ],
};

export function BulkToolbar({ selectedJobs, activeTab, clearSelection, bottomOffset = "bottom-4" }: BulkToolbarProps) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const count = selectedJobs.size;

  if (count === 0) return null;

  const actions = ACTIONS_BY_PIPELINE[activeTab] || [];
  const closeDialog = () => setOpenDialog(null);

  return (
    <>
      <div className={`fixed ${bottomOffset} left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom duration-200`}>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold">
              {count}
            </Badge>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              job{count !== 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  size="sm"
                  variant={action.variant || "default"}
                  className="gap-1.5"
                  onClick={() => setOpenDialog(action.key)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-border" />

          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearSelection}>
            <IconX className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <BulkApproveDialog
        open={openDialog === "approve"}
        onClose={closeDialog}
        selectedJobs={selectedJobs}
        clearSelection={clearSelection}
      />
      <BulkScheduleDialog
        open={openDialog === "schedule"}
        onClose={closeDialog}
        selectedJobs={selectedJobs}
        clearSelection={clearSelection}
      />
      <BulkFlightLogDialog
        open={openDialog === "flight-log"}
        onClose={closeDialog}
        selectedJobs={selectedJobs}
        clearSelection={clearSelection}
      />
      <BulkDeliverDialog
        open={openDialog === "deliver"}
        onClose={closeDialog}
        selectedJobs={selectedJobs}
        clearSelection={clearSelection}
      />
      <BulkBillDialog
        open={openDialog === "bill"}
        onClose={closeDialog}
        selectedJobs={selectedJobs}
        clearSelection={clearSelection}
      />
      <BulkDeleteDialog
        open={openDialog === "delete"}
        onClose={closeDialog}
        selectedJobs={selectedJobs}
        clearSelection={clearSelection}
      />
    </>
  );
}
