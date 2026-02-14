"use client";

import { useState } from "react";
import {
  IconShieldCheck,
  IconShieldX,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import type { ComplianceEntry } from "../../types/community";

interface CompliancePanelProps {
  reports: ComplianceEntry[];
}

const STATUS_CONFIG = {
  pass: { icon: IconShieldCheck, color: "text-green-500", bg: "bg-green-500/10", label: "Pass" },
  fail: { icon: IconShieldX, color: "text-red-500", bg: "bg-red-500/10", label: "Fail" },
  warning: { icon: IconAlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Warning" },
};

export function CompliancePanel({ reports }: CompliancePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const counts = {
    pass: reports.filter((r) => r.status === "pass").length,
    fail: reports.filter((r) => r.status === "fail").length,
    warning: reports.filter((r) => r.status === "warning").length,
  };

  return (
    <div className="absolute bottom-4 left-4 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
      >
        <IconShieldCheck className="h-4 w-4" />
        Compliance
        <span className="text-xs text-muted-foreground">
          ({counts.pass}P / {counts.fail}F / {counts.warning}W)
        </span>
        {isOpen ? <IconChevronUp className="h-3.5 w-3.5" /> : <IconChevronDown className="h-3.5 w-3.5" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-72 max-h-64 overflow-y-auto">
          {reports.length === 0 && (
            <p className="text-xs text-muted-foreground p-3">No compliance reports available.</p>
          )}
          {reports.map((report, idx) => {
            const config = STATUS_CONFIG[report.status];
            const Icon = config.icon;
            return (
              <div key={idx} className={`flex items-start gap-2 px-3 py-2 border-b last:border-b-0 ${config.bg}`}>
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Parcel {report.parcelId}</div>
                  {report.notes && (
                    <div className="text-xs text-muted-foreground mt-0.5">{report.notes}</div>
                  )}
                </div>
                <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
