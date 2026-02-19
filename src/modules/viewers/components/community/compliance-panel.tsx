"use client";

/**
 * CompliancePanel — Community Viewer
 *
 * Full CRUD for compliance entries:
 *  - Add entry (parcel ID, status, notes)
 *  - Edit entry inline
 *  - Delete entry
 *  - Import from JSON (bulk)
 *  - Summary badge counts (Pass / Fail / Warning)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  IconShieldCheck, IconShieldX, IconAlertTriangle,
  IconChevronDown, IconChevronUp, IconPlus, IconTrash,
  IconEdit, IconDownload, IconCheck, IconX,
} from "@tabler/icons-react";
import type { ComplianceEntry } from "../../types/community";
import { toast } from "sonner";

interface CompliancePanelProps {
  reports: ComplianceEntry[];
  onChange: (reports: ComplianceEntry[]) => void;
}

const STATUS_CONFIG = {
  pass:    { icon: IconShieldCheck,   color: "text-green-500",  bg: "bg-green-500/10",  label: "Pass" },
  fail:    { icon: IconShieldX,       color: "text-red-500",    bg: "bg-red-500/10",    label: "Fail" },
  warning: { icon: IconAlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Warning" },
};

const STATUSES: ComplianceEntry["status"][] = ["pass", "fail", "warning"];

// ── JSON Import Dialog ────────────────────────────────────────────────────────

function JsonImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (entries: ComplianceEntry[]) => void;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    try {
      const parsed = JSON.parse(raw);
      const entries: ComplianceEntry[] = [];

      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (!item.parcelId && !item.parcel_id) {
          throw new Error("Each entry must have a parcelId field");
        }
        const status = (item.status || "warning") as ComplianceEntry["status"];
        if (!STATUSES.includes(status)) {
          throw new Error(`Invalid status "${status}" — must be pass, fail, or warning`);
        }
        entries.push({
          parcelId: String(item.parcelId || item.parcel_id),
          status,
          notes: item.notes || item.note || undefined,
        });
      }

      onImport(entries);
      setRaw("");
      setError("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconDownload className="h-5 w-5" />
            Import Compliance Data (JSON)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste a JSON array of compliance entries. Each object needs{" "}
            <code className="text-xs bg-muted px-1 rounded">parcelId</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">status</code> (pass/fail/warning),
            and optionally <code className="text-xs bg-muted px-1 rounded">notes</code>.
          </p>

          <pre className="text-xs bg-muted rounded p-2 text-muted-foreground overflow-auto">
{`[
  { "parcelId": "12-34-56-78", "status": "fail", "notes": "Dirty roof" },
  { "parcelId": "98-76-54-32", "status": "pass" }
]`}
          </pre>

          <Textarea
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(""); }}
            placeholder='[{"parcelId": "...", "status": "pass"}]'
            rows={6}
            className="font-mono text-xs"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!raw.trim()}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function CompliancePanel({ reports, onChange }: CompliancePanelProps) {
  const [isOpen,     setIsOpen]     = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Form state for adding
  const [newParcelId, setNewParcelId] = useState("");
  const [newStatus,   setNewStatus]   = useState<ComplianceEntry["status"]>("pass");
  const [newNotes,    setNewNotes]    = useState("");

  // Edit form state
  const [editParcelId, setEditParcelId] = useState("");
  const [editStatus,   setEditStatus]   = useState<ComplianceEntry["status"]>("pass");
  const [editNotes,    setEditNotes]    = useState("");

  const counts = {
    pass:    reports.filter((r) => r.status === "pass").length,
    fail:    reports.filter((r) => r.status === "fail").length,
    warning: reports.filter((r) => r.status === "warning").length,
  };

  const handleAdd = () => {
    if (!newParcelId.trim()) return;
    const entry: ComplianceEntry = {
      parcelId: newParcelId.trim(),
      status:   newStatus,
      notes:    newNotes.trim() || undefined,
    };
    onChange([...reports, entry]);
    setNewParcelId(""); setNewStatus("pass"); setNewNotes("");
    setAdding(false);
  };

  const handleDelete = (idx: number) => {
    onChange(reports.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    const r = reports[idx];
    setEditParcelId(r.parcelId);
    setEditStatus(r.status);
    setEditNotes(r.notes || "");
    setEditingId(idx);
  };

  const handleEditSave = (idx: number) => {
    if (!editParcelId.trim()) return;
    const updated = reports.map((r, i) =>
      i === idx
        ? { parcelId: editParcelId.trim(), status: editStatus, notes: editNotes.trim() || undefined }
        : r
    );
    onChange(updated);
    setEditingId(null);
  };

  const handleImport = (entries: ComplianceEntry[]) => {
    // Merge: replace existing parcelIds, append new ones
    const merged = [...reports];
    for (const entry of entries) {
      const idx = merged.findIndex((r) => r.parcelId === entry.parcelId);
      if (idx >= 0) {
        merged[idx] = entry;
      } else {
        merged.push(entry);
      }
    }
    onChange(merged);
    toast.success(`Imported ${entries.length} compliance entries`);
  };

  return (
    <>
      <div className="absolute bottom-4 left-4 z-[1000] max-w-xs">
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          <IconShieldCheck className="h-4 w-4" />
          Compliance
          <span className="text-xs text-muted-foreground">
            ({counts.pass}P / {counts.fail}F / {counts.warning}W)
          </span>
          {isOpen
            ? <IconChevronUp className="h-3.5 w-3.5" />
            : <IconChevronDown className="h-3.5 w-3.5" />}
        </button>

        {/* Panel */}
        {isOpen && (
          <div className="absolute bottom-full mb-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-80">
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Compliance Reports ({reports.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowImport(true)}
                  className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent"
                  title="Import from JSON"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setAdding(true); setIsOpen(true); }}
                  className="text-xs text-primary hover:text-primary/80 px-1.5 py-0.5 rounded hover:bg-accent"
                  title="Add entry"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Entries list */}
            <div className="max-h-56 overflow-y-auto">
              {reports.length === 0 && !adding && (
                <p className="text-xs text-muted-foreground p-3">
                  No compliance reports. Click + to add one.
                </p>
              )}

              {reports.map((report, idx) => {
                const cfg = STATUS_CONFIG[report.status];
                const Icon = cfg.icon;

                // Edit mode
                if (editingId === idx) {
                  return (
                    <div key={idx} className="p-2 border-b last:border-b-0 space-y-2">
                      <Input
                        value={editParcelId}
                        onChange={(e) => setEditParcelId(e.target.value)}
                        placeholder="Parcel ID"
                        className="h-7 text-xs"
                      />
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as typeof editStatus)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-xs flex-1" onClick={() => handleEditSave(idx)}>
                          <IconCheck className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingId(null)}>
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`flex items-start gap-2 px-3 py-2 border-b last:border-b-0 ${cfg.bg} group`}>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{report.parcelId}</div>
                      {report.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {report.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(idx)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <IconEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Add new entry inline */}
            {adding && (
              <div className="p-3 border-t space-y-2">
                <Input
                  value={newParcelId}
                  onChange={(e) => setNewParcelId(e.target.value)}
                  placeholder="Parcel ID *"
                  className="h-7 text-xs"
                  autoFocus
                />
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as typeof newStatus)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="h-7 text-xs"
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-6 text-xs flex-1"
                    onClick={handleAdd}
                    disabled={!newParcelId.trim()}
                  >
                    <IconPlus className="h-3 w-3 mr-1" /> Add
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-6 text-xs"
                    onClick={() => { setAdding(false); setNewParcelId(""); setNewNotes(""); }}
                  >
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <JsonImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </>
  );
}
