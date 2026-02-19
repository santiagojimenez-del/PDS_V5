"use client";

/**
 * FeaturePropertiesPanel
 *
 * Floating panel shown when a polygon is selected on the map.
 * Allows editing: name, notes, classification assignment.
 * For Community viewer, also shows compliance status selector.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  IconX, IconShieldCheck, IconShieldX, IconAlertTriangle,
} from "@tabler/icons-react";
import type { ViewerFeature, ClassificationItem } from "../../types";

export type ComplianceStatus = "pass" | "fail" | "warning" | "none";

export interface FeatureProperties {
  name?: string;
  notes?: string;
  classificationId?: string;
  complianceStatus?: ComplianceStatus; // community only
}

interface FeaturePropertiesPanelProps {
  feature: ViewerFeature | null;
  classifications: ClassificationItem[];
  showCompliance?: boolean; // community viewer only
  onUpdate: (id: string, props: FeatureProperties) => void;
  onClose: () => void;
}

const COMPLIANCE_OPTIONS: { value: ComplianceStatus; label: string; icon: typeof IconShieldCheck; color: string }[] = [
  { value: "none",    label: "No Status",  icon: IconShieldCheck,   color: "text-muted-foreground" },
  { value: "pass",    label: "Pass",       icon: IconShieldCheck,   color: "text-green-500" },
  { value: "fail",    label: "Fail",       icon: IconShieldX,       color: "text-red-500" },
  { value: "warning", label: "Warning",    icon: IconAlertTriangle, color: "text-yellow-500" },
];

export function FeaturePropertiesPanel({
  feature,
  classifications,
  showCompliance = false,
  onUpdate,
  onClose,
}: FeaturePropertiesPanelProps) {
  const [name,       setName]       = useState("");
  const [notes,      setNotes]      = useState("");
  const [clsId,      setClsId]      = useState<string>("none");
  const [compliance, setCompliance] = useState<ComplianceStatus>("none");

  // Sync state when selected feature changes
  useEffect(() => {
    if (!feature) return;
    setName(feature.properties.name       as string ?? "");
    setNotes(feature.properties.notes     as string ?? "");
    setClsId(feature.properties.classificationId as string ?? "none");
    setCompliance((feature.properties.complianceStatus as ComplianceStatus) ?? "none");
  }, [feature?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!feature) return null;

  const cls = classifications.find((c) => c.id === clsId);

  const handleSave = () => {
    onUpdate(feature.id, {
      name:             name.trim() || undefined,
      notes:            notes.trim() || undefined,
      classificationId: clsId === "none" ? undefined : clsId,
      complianceStatus: compliance === "none" ? undefined : compliance,
    });
  };

  const complianceOpt = COMPLIANCE_OPTIONS.find((o) => o.value === compliance)!;
  const ComplianceIcon = complianceOpt.icon;

  return (
    <div className="absolute bottom-14 left-4 z-[1000] w-72 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-semibold">Feature Properties</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs">Name / Parcel ID</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Area name or parcel ID…"
            className="h-8 text-sm"
          />
        </div>

        {/* Classification */}
        <div className="space-y-1">
          <Label className="text-xs">Classification</Label>
          <Select value={clsId} onValueChange={setClsId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue>
                {cls ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cls.color }}
                    />
                    {cls.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">None</span>
              </SelectItem>
              {classifications.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compliance (community only) */}
        {showCompliance && (
          <div className="space-y-1">
            <Label className="text-xs">Compliance Status</Label>
            <Select value={compliance} onValueChange={(v) => setCompliance(v as ComplianceStatus)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue>
                  <span className={`flex items-center gap-2 ${complianceOpt.color}`}>
                    <ComplianceIcon className="h-3.5 w-3.5" />
                    {complianceOpt.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COMPLIANCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={`flex items-center gap-2 ${opt.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes…"
            className="text-sm resize-none"
            rows={2}
          />
        </div>

        {/* Feature ID badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs font-mono truncate max-w-[140px]">
            {feature.id}
          </Badge>
          <Button size="sm" onClick={handleSave} className="h-7 text-xs">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
