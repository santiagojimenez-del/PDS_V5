"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconMapPin,
  IconBuilding,
  IconPackage,
  IconUsers,
  IconChecklist,
  IconTrendingUp,
  IconClock,
  IconShare,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { JobEditDialog } from "@/modules/workflow/components/job-edit-dialog";
import { JobActionDialogs } from "@/modules/workflow/components/job-action-dialogs";
import { ShareModal } from "@/components/shared/share-modal";
import { VIEWER_PRODUCTS, VIEWER_PAGE_IDS } from "@/lib/constants";
import { toast } from "sonner";

interface JobData {
  id: number;
  pipeline: string;
  name: string;
  createdBy: number;
  siteId: number | null;
  siteName: string;
  clientId: number | null;
  clientType: string;
  clientName: string;
  dates: Record<string, string>;
  products: { id: number; name: string }[];
  meta: Record<string, string>;
}

async function fetchJob(id: string) {
  const res = await fetch(`/api/workflow/jobs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  const json = await res.json();
  return json.data as JobData;
}

const PIPELINE_LABELS: Record<string, string> = {
  bids: "Bid",
  scheduled: "Scheduled",
  "processing-deliver": "Processing & Delivery",
  bill: "Billing",
  completed: "Completed",
};

const PIPELINE_COLORS: Record<string, string> = {
  bids: "bg-yellow-500",
  scheduled: "bg-blue-500",
  "processing-deliver": "bg-purple-500",
  bill: "bg-orange-500",
  completed: "bg-green-500",
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params?.id as string;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ pageId: number; requestToken: string } | null>(null);

  // Maps VIEWER_PRODUCTS IDs to viewer type strings
  const VIEWER_TYPE_MAP: Record<number, string> = {
    [VIEWER_PRODUCTS.LANDSCAPE]: "landscape",
    [VIEWER_PRODUCTS.COMMUNITY]: "community",
    [VIEWER_PRODUCTS.CONSTRUCT]: "construct",
  };

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId),
    enabled: !!jobId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workflow/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete job");
    },
    onSuccess: () => {
      toast.success("Job deleted successfully");
      router.push("/workflow/jobs");
    },
    onError: () => {
      toast.error("Failed to delete job");
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const getAvailableActions = (pipeline: string) => {
    const actions = [];
    if (pipeline === "bids") {
      actions.push({ key: "approve", label: "Approve", icon: IconChecklist });
    }
    if (pipeline === "bids" || pipeline === "scheduled") {
      actions.push({ key: "schedule", label: "Schedule", icon: IconCalendar });
    }
    if (pipeline === "scheduled") {
      actions.push({ key: "log-flight", label: "Log Flight", icon: IconClock });
    }
    if (pipeline === "processing-deliver") {
      actions.push({ key: "deliver", label: "Mark as Delivered", icon: IconPackage });
    }
    if (pipeline === "processing-deliver" || pipeline === "bill") {
      actions.push({ key: "bill", label: "Bill Job", icon: IconTrendingUp });
    }
    return actions;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Job Not Found</h2>
          <p className="text-muted-foreground">The requested job could not be found.</p>
        </div>
        <Link href="/workflow/jobs">
          <Button variant="outline">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const availableActions = getAvailableActions(job.pipeline);
  const assignedPersons = job.meta.persons_assigned
    ? JSON.parse(job.meta.persons_assigned)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/workflow/jobs">
              <Button variant="ghost" size="icon">
                <IconArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">{job.name || `Job #${job.id}`}</h2>
              <p className="text-sm text-muted-foreground">Job ID: {job.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${PIPELINE_COLORS[job.pipeline] || "bg-gray-500"} text-white border-none`}
          >
            {PIPELINE_LABELS[job.pipeline] || job.pipeline}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit Job
        </Button>
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.key}
              variant="default"
              onClick={() => setActionDialog(action.key)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
        <Button variant="destructive" onClick={handleDelete}>
          <IconTrash className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Job Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core job details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <IconMapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Site</p>
                <p className="text-sm text-muted-foreground">
                  {job.siteName}
                  {job.siteId && (
                    <Link href={`/workflow/sites/${job.siteId}`} className="ml-2 text-primary hover:underline">
                      View Site
                    </Link>
                  )}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <IconBuilding className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm text-muted-foreground">{job.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  Type: {job.clientType === "organization" ? "Organization" : "Individual"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <IconPackage className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Products ({job.products.length})</p>
                {job.products.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {job.products.map((p, idx) => {
                      const viewerType = VIEWER_TYPE_MAP[p.id];
                      const pageId = viewerType ? VIEWER_PAGE_IDS[viewerType] : null;
                      const jobProductId = `${job.id}-${idx}`;
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {p.name}
                          </Badge>
                          {pageId && (
                            <button
                              onClick={() => setShareModal({ pageId, requestToken: jobProductId })}
                              className="rounded p-0.5 text-muted-foreground hover:text-primary transition-colors"
                              title={`Share ${viewerType} viewer`}
                            >
                              <IconShare className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No products assigned</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Important dates and milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.dates.requested && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date Requested:</span>
                <span className="font-medium">{job.dates.requested}</span>
              </div>
            )}
            {job.dates.approved_flight && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flight Approved:</span>
                <span className="font-medium">{job.dates.approved_flight}</span>
              </div>
            )}
            {job.dates.scheduled && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scheduled:</span>
                <span className="font-medium">{job.dates.scheduled}</span>
              </div>
            )}
            {job.dates.flown && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flight Completed:</span>
                <span className="font-medium">{job.dates.flown}</span>
              </div>
            )}
            {job.dates.delivered && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivered:</span>
                <span className="font-medium">{job.dates.delivered}</span>
              </div>
            )}
            {job.dates.billed && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Billed:</span>
                <span className="font-medium">{job.dates.billed}</span>
              </div>
            )}
            {!job.dates.requested && !job.dates.scheduled && !job.dates.flown && (
              <p className="text-sm text-muted-foreground">No timeline events recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Assignment & Staff */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
            <CardDescription>Assigned staff and pilots</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedPersons.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{assignedPersons.length} person(s) assigned</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {assignedPersons.map((personId: number) => (
                    <Badge key={personId} variant="outline" className="text-xs">
                      User #{personId}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No staff assigned yet</p>
            )}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Financial</CardTitle>
            <CardDescription>Billing and payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.meta.amount_payable && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount Payable:</span>
                <span className="font-medium">${job.meta.amount_payable}</span>
              </div>
            )}
            {job.meta.invoice_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-medium">{job.meta.invoice_number}</span>
              </div>
            )}
            {job.meta.invoice_paid && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Date:</span>
                <span className="font-medium">{job.meta.invoice_paid}</span>
              </div>
            )}
            {!job.meta.amount_payable && !job.meta.invoice_number && (
              <p className="text-sm text-muted-foreground">No financial information recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {job.meta.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{job.meta.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <JobEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        jobId={job.id}
        initialData={{
          name: job.name,
          siteId: job.siteId,
          clientId: job.clientId,
          clientType: job.clientType as "organization" | "user",
          products: job.products.map((p) => p.id),
          notes: job.meta.notes || "",
          amountPayable: job.meta.amount_payable || "",
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["job", jobId] });
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
        }}
      />

      <JobActionDialogs
        jobIds={[job.id]}
        open={actionDialog}
        onOpenChange={(open) => !open && setActionDialog(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["job", jobId] });
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
          setActionDialog(null);
        }}
      />

      {shareModal && (
        <ShareModal
          pageId={shareModal.pageId}
          requestToken={shareModal.requestToken}
          open={!!shareModal}
          onOpenChange={(open) => !open && setShareModal(null)}
        />
      )}
    </div>
  );
}
