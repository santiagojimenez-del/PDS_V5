"use client";

/**
 * /hub/workflow/recurring — Recurring Job Templates
 *
 * Lists all recurring templates and allows creating, editing, toggling
 * active status, generating occurrences, and deleting templates.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconRepeat, IconMapPin, IconBuilding, IconCalendar, IconPlus,
  IconEdit, IconTrash, IconLoader2, IconBolt, IconPower,
} from "@tabler/icons-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RecurringTemplate {
  id: number;
  name: string;
  active: boolean;
  isManual: boolean;
  siteName: string;
  siteId: number;
  clientName: string;
  clientId: number;
  clientType: string;
  rrule: string | null;
  timezone: string;
  amountPayable: string;
  notes: string | null;
  windowDays: number;
  dtstart: string | null;
  dtend: string | null;
  createdAt: string | null;
}

interface SiteOption  { id: number; name: string; address?: string | null }
interface OrgOption   { id: number; name: string }

// ── RRULE helpers ─────────────────────────────────────────────────────────────

const WEEKDAYS = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
];

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata",
  "Australia/Sydney", "UTC",
];

interface RRuleForm {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay: string[]; // weekdays, only relevant for WEEKLY
  byMonthDay: number; // 1–28, for MONTHLY
}

function buildRRule(f: RRuleForm): string {
  let rule = `FREQ=${f.freq};INTERVAL=${f.interval}`;
  if (f.freq === "WEEKLY" && f.byDay.length > 0) {
    rule += `;BYDAY=${f.byDay.join(",")}`;
  }
  if (f.freq === "MONTHLY" && f.byMonthDay >= 1) {
    rule += `;BYMONTHDAY=${f.byMonthDay}`;
  }
  return rule;
}

function parseRRule(rrule: string | null): RRuleForm {
  if (!rrule) return { freq: "WEEKLY", interval: 1, byDay: ["MO"], byMonthDay: 1 };
  const get = (key: string): string | null => {
    const m = rrule.match(new RegExp(`${key}=([^;]+)`));
    return m ? m[1] : null;
  };
  const freq = (get("FREQ") || "WEEKLY") as RRuleForm["freq"];
  const interval = parseInt(get("INTERVAL") || "1", 10) || 1;
  const byDay = get("BYDAY")?.split(",") || [];
  const byMonthDay = parseInt(get("BYMONTHDAY") || "1", 10) || 1;
  return { freq, interval, byDay, byMonthDay };
}

function humanRRule(rrule: string | null): string {
  if (!rrule) return "Manual";
  const f = parseRRule(rrule);
  const intervalStr = f.interval > 1 ? `every ${f.interval} ` : "";
  switch (f.freq) {
    case "DAILY":   return `${intervalStr}daily`;
    case "WEEKLY":  return `${intervalStr}weekly${f.byDay.length ? " on " + f.byDay.join(", ") : ""}`;
    case "MONTHLY": return `${intervalStr}monthly on day ${f.byMonthDay}`;
    case "YEARLY":  return `${intervalStr}yearly`;
    default:        return rrule;
  }
}

// ── Template Form ─────────────────────────────────────────────────────────────

interface TemplateForm {
  name: string;
  siteId: string;
  clientType: "organization" | "user";
  clientId: string;
  isManual: boolean;
  rruleForm: RRuleForm;
  timezone: string;
  dtstart: string;
  dtend: string;
  windowDays: number;
  amountPayable: string;
  notes: string;
}

const EMPTY_FORM: TemplateForm = {
  name: "", siteId: "", clientType: "organization", clientId: "",
  isManual: false, timezone: "America/New_York",
  rruleForm: { freq: "WEEKLY", interval: 1, byDay: ["MO"], byMonthDay: 1 },
  dtstart: "", dtend: "", windowDays: 60, amountPayable: "0.00", notes: "",
};

// ── Template Modal ─────────────────────────────────────────────────────────────

function TemplateModal({
  open, onClose, template, sites, orgs,
}: {
  open: boolean;
  onClose: (saved?: boolean) => void;
  template: RecurringTemplate | null;
  sites: SiteOption[];
  orgs: OrgOption[];
}) {
  const isEdit = !!template;
  const [form, setForm] = useState<TemplateForm>(() => {
    if (!template) return EMPTY_FORM;
    return {
      name:         template.name,
      siteId:       String(template.siteId),
      clientType:   template.clientType as "organization" | "user",
      clientId:     String(template.clientId),
      isManual:     template.isManual,
      timezone:     template.timezone || "America/New_York",
      rruleForm:    parseRRule(template.rrule),
      dtstart:      template.dtstart ? template.dtstart.slice(0, 10) : "",
      dtend:        template.dtend   ? template.dtend.slice(0, 10)   : "",
      windowDays:   template.windowDays || 60,
      amountPayable: template.amountPayable || "0.00",
      notes:        template.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TemplateForm>(k: K, v: TemplateForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setRRule = <K extends keyof RRuleForm>(k: K, v: RRuleForm[K]) =>
    setForm((p) => ({ ...p, rruleForm: { ...p.rruleForm, [k]: v } }));

  const toggleDay = (day: string) => {
    setForm((p) => {
      const days = p.rruleForm.byDay.includes(day)
        ? p.rruleForm.byDay.filter((d) => d !== day)
        : [...p.rruleForm.byDay, day];
      return { ...p, rruleForm: { ...p.rruleForm, byDay: days } };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.siteId || !form.clientId) {
      toast.error("Name, site, and client are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name:          form.name.trim(),
        siteId:        parseInt(form.siteId),
        clientType:    form.clientType,
        clientId:      parseInt(form.clientId),
        isManual:      form.isManual,
        rrule:         form.isManual ? null : buildRRule(form.rruleForm),
        timezone:      form.timezone,
        dtstart:       form.dtstart ? new Date(form.dtstart).toISOString() : null,
        dtend:         form.dtend   ? new Date(form.dtend).toISOString()   : null,
        windowDays:    form.windowDays,
        amountPayable: form.amountPayable,
        notes:         form.notes || null,
        products:      null,
      };

      const url = isEdit ? `/api/recurring/${template!.id}` : "/api/recurring";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to save"); return; }
      toast.success(isEdit ? "Template updated" : "Template created");
      onClose(true);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconRepeat className="h-5 w-5" />
            {isEdit ? "Edit Template" : "New Recurring Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="space-y-1">
            <Label>Template Name *</Label>
            <Input
              placeholder="Weekly Site Survey"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Site + Client */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Site *</Label>
              <Select value={form.siteId} onValueChange={(v) => set("siteId", v)}>
                <SelectTrigger><SelectValue placeholder="Select site…" /></SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Client Type *</Label>
              <Select
                value={form.clientType}
                onValueChange={(v) => { set("clientType", v as "organization" | "user"); set("clientId", ""); }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client selector */}
          {form.clientType === "organization" && (
            <div className="space-y-1">
              <Label>Organization *</Label>
              <Select value={form.clientId} onValueChange={(v) => set("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Select organization…" /></SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.clientType === "user" && (
            <div className="space-y-1">
              <Label>Client User ID *</Label>
              <Input
                type="number"
                placeholder="User ID"
                value={form.clientId}
                onChange={(e) => set("clientId", e.target.value)}
              />
            </div>
          )}

          {/* Manual toggle */}
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Switch
              checked={form.isManual}
              onCheckedChange={(v) => set("isManual", v)}
              id="manual-toggle"
            />
            <div>
              <Label htmlFor="manual-toggle" className="cursor-pointer">Manual trigger</Label>
              <p className="text-xs text-muted-foreground">No automatic schedule — generate jobs on demand</p>
            </div>
          </div>

          {/* RRULE builder */}
          {!form.isManual && (
            <div className="space-y-3 rounded-md border p-4">
              <p className="font-medium text-sm">Recurrence Schedule</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Frequency</Label>
                  <Select
                    value={form.rruleForm.freq}
                    onValueChange={(v) => setRRule("freq", v as RRuleForm["freq"])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Every N {form.rruleForm.freq.toLowerCase().slice(0, -2)}(s)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={form.rruleForm.interval}
                    onChange={(e) => setRRule("interval", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {form.rruleForm.freq === "WEEKLY" && (
                <div className="space-y-1">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors
                          ${form.rruleForm.byDay.includes(d.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.rruleForm.freq === "MONTHLY" && (
                <div className="space-y-1">
                  <Label>Day of Month (1–28)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={form.rruleForm.byMonthDay}
                    onChange={(e) => setRRule("byMonthDay", parseInt(e.target.value) || 1)}
                  />
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Preview: <strong>{humanRRule(buildRRule(form.rruleForm))}</strong>
              </div>
            </div>
          )}

          {/* Timezone + window */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Window Days</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.windowDays}
                onChange={(e) => set("windowDays", parseInt(e.target.value) || 60)}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start Date (optional)</Label>
              <Input type="date" value={form.dtstart} onChange={(e) => set("dtstart", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date (optional)</Label>
              <Input type="date" value={form.dtend} onChange={(e) => set("dtend", e.target.value)} />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label>Amount Payable</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amountPayable}
              onChange={(e) => set("amountPayable", e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RecurringJobsPage() {
  const qc = useQueryClient();
  const [modal,     setModal]     = useState<{ open: boolean; template: RecurringTemplate | null }>({ open: false, template: null });
  const [deleting,  setDeleting]  = useState<RecurringTemplate | null>(null);
  const [toggling,  setToggling]  = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: async () => {
      const res = await fetch("/api/recurring");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as { templates: RecurringTemplate[]; total: number };
    },
  });

  const { data: sitesData } = useQuery({
    queryKey: ["sites-list"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as { sites: SiteOption[] };
    },
  });

  const { data: orgsData } = useQuery({
    queryKey: ["organizations-list"],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as { organizations: OrgOption[] };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["recurring"] });

  const handleDelete = async (t: RecurringTemplate) => {
    try {
      const res = await fetch(`/api/recurring/${t.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to delete"); return; }
      toast.success(`"${t.name}" deleted`);
      refresh();
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (t: RecurringTemplate) => {
    setToggling(t.id);
    try {
      const res = await fetch(`/api/recurring/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !t.active }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed"); return; }
      toast.success(t.active ? `"${t.name}" deactivated` : `"${t.name}" activated`);
      refresh();
    } catch {
      toast.error("Failed to update template");
    } finally {
      setToggling(null);
    }
  };

  const handleGenerate = async (t: RecurringTemplate) => {
    setGenerating(t.id);
    try {
      const res = await fetch(`/api/recurring/${t.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: t.id, maxCount: 100 }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to generate"); return; }
      const generated: number = json.data?.generated ?? 0;
      if (generated === 0) {
        toast.info(`No new occurrences to generate for "${t.name}"`);
      } else {
        toast.success(`Generated ${generated} occurrence(s) for "${t.name}"`);
      }
    } catch {
      toast.error("Failed to generate occurrences");
    } finally {
      setGenerating(null);
    }
  };

  const sites = sitesData?.sites || [];
  const orgs  = orgsData?.organizations || [];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recurring Jobs</h2>
          <p className="text-muted-foreground">{data?.total || 0} recurring job templates.</p>
        </div>
        <Button onClick={() => setModal({ open: true, template: null })} className="gap-2">
          <IconPlus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (data?.templates.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconRepeat className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No recurring job templates yet.</p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => setModal({ open: true, template: null })}
            >
              <IconPlus className="h-4 w-4" /> Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data!.templates.map((t) => (
            <Card key={t.id} className={t.active ? "" : "opacity-60"}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <IconRepeat className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-semibold truncate">{t.name}</h3>
                    <Badge variant={t.active ? "default" : "secondary"} className="text-xs">
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                    {t.isManual && <Badge variant="outline" className="text-xs">Manual</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconMapPin className="h-3 w-3" /> {t.siteName}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconBuilding className="h-3 w-3" /> {t.clientName}
                    </span>
                    {!t.isManual && (
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-3 w-3" /> {humanRRule(t.rrule)}
                      </span>
                    )}
                    <span>{t.timezone}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-lg font-bold">${t.amountPayable}</span>

                  <div className="flex items-center gap-1">
                    {/* Generate occurrences */}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleGenerate(t)}
                      disabled={generating === t.id}
                      title="Generate occurrences"
                    >
                      {generating === t.id
                        ? <IconLoader2 className="h-4 w-4 animate-spin" />
                        : <IconBolt className="h-4 w-4" />}
                    </Button>

                    {/* Toggle active */}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleToggle(t)}
                      disabled={toggling === t.id}
                      title={t.active ? "Deactivate" : "Activate"}
                    >
                      {toggling === t.id
                        ? <IconLoader2 className="h-4 w-4 animate-spin" />
                        : <IconPower className={`h-4 w-4 ${t.active ? "text-green-500" : "text-muted-foreground"}`} />}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setModal({ open: true, template: t })}
                      title="Edit"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(t)}
                      title="Delete"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal.open && (
        <TemplateModal
          open={modal.open}
          onClose={(saved) => {
            setModal({ open: false, template: null });
            if (saved) refresh();
          }}
          template={modal.template}
          sites={sites}
          orgs={orgs}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleting?.name}</strong>? This cannot be undone. Templates with
              generated jobs cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && handleDelete(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
