import { Text, Section, Heading, Hr } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["job-status-update"];

export function JobStatusUpdateEmail({
  recipientName,
  jobId,
  jobTitle,
  oldStatus,
  newStatus,
  message,
}: Props) {
  return (
    <BaseLayout preview={`Job Update #${jobId}`}>
      <Heading style={h1}>Job Update</Heading>

      <Text style={text}>
        Hello <strong>{recipientName}</strong>,
      </Text>

      <Text style={text}>
        The status of the following job has been updated:
      </Text>

      <Section style={jobCard}>
        <Text style={jobLabel}>Job ID:</Text>
        <Text style={jobValue}>#{jobId}</Text>

        <Text style={jobLabel}>Title:</Text>
        <Text style={jobValue}>{jobTitle}</Text>

        <Hr style={divider} />

        <Section style={statusChange}>
          <Section style={statusSection}>
            <Text style={statusLabel}>Previous Status:</Text>
            <Section style={statusBadgeOld}>
              <Text style={statusText}>{oldStatus}</Text>
            </Section>
          </Section>

          <Text style={arrow}>→</Text>

          <Section style={statusSection}>
            <Text style={statusLabel}>New Status:</Text>
            <Section style={statusBadgeNew}>
              <Text style={statusText}>{newStatus}</Text>
            </Section>
          </Section>
        </Section>
      </Section>

      {message && (
        <Section style={messageBox}>
          <Text style={messageTitle}>📝 Additional Message:</Text>
          <Text style={messageText}>{message}</Text>
        </Section>
      )}

      <Hr style={hr} />

      <Text style={textMuted}>
        You can view more details about this job on the ProDrones Hub platform.
      </Text>

      <Text style={text}>
        Best regards,
        <br />
        The ProDrones Hub Team
      </Text>
    </BaseLayout>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px",
  padding: "0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const textMuted = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "16px 0",
};

const jobCard = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  border: "1px solid #e5e7eb",
  margin: "20px 0",
};

const jobLabel = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
  margin: "12px 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const jobValue = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 8px 0",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "16px 0",
};

const statusChange = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  margin: "16px 0",
};

const statusSection = {
  flex: "1",
  textAlign: "center" as const,
};

const statusLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
};

const statusBadgeOld = {
  backgroundColor: "#e5e7eb",
  borderRadius: "6px",
  padding: "8px 16px",
  display: "inline-block",
};

const statusBadgeNew = {
  backgroundColor: "#8600FB",
  borderRadius: "6px",
  padding: "8px 16px",
  display: "inline-block",
};

const statusText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const arrow = {
  color: "#8600FB",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 8px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const messageBox = {
  backgroundColor: "#fffbeb",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "4px",
  padding: "16px",
  margin: "20px 0",
};

const messageTitle = {
  color: "#f59e0b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const messageText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};
