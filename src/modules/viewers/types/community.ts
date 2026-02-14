import type { BaseDeliverableData } from "./index";

export interface ComplianceEntry {
  parcelId: string;
  status: "pass" | "fail" | "warning";
  notes?: string;
}

export interface CommunityDeliverableData extends BaseDeliverableData {
  complianceReports?: ComplianceEntry[];
  propertyOverlayEnabled?: boolean;
}
