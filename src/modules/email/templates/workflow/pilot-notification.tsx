import { Text, Section, Heading, Hr, Link } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["pilot-notification"];

export function PilotNotificationEmail({
  pilotName,
  jobId,
  jobTitle,
  clientName,
  scheduledDate,
  action,
}: Props) {
  const actionTitles = {
    assigned: "New Job Assigned",
    scheduled: "Job Scheduled",
    rescheduled: "Job Rescheduled",
    cancelled: "Job Cancelled",
  };

  const actionMessages = {
    assigned: "You have been assigned a new job:",
    scheduled: "Your job has been scheduled:",
    rescheduled: "Your job date has been changed:",
    cancelled: "The following job has been cancelled:",
  };

  const actionColors = {
    assigned: "#0070f3",
    scheduled: "#00875a",
    rescheduled: "#ff9800",
    cancelled: "#e53e3e",
  };

  return (
    <BaseLayout preview={`${actionTitles[action]} #${jobId}`}>
      <Section style={{ ...statusBadge, backgroundColor: actionColors[action] }}>
        <Text style={statusText}>{actionTitles[action]}</Text>
      </Section>

      <Heading style={h1}>Hello {pilotName},</Heading>

      <Text style={text}>{actionMessages[action]}</Text>

      <Section style={jobCard}>
        <Text style={jobLabel}>Job ID:</Text>
        <Text style={jobValue}>#{jobId}</Text>

        <Text style={jobLabel}>Title:</Text>
        <Text style={jobValue}>{jobTitle}</Text>

        <Text style={jobLabel}>Client:</Text>
        <Text style={jobValue}>{clientName}</Text>

        {scheduledDate && action !== "cancelled" && (
          <>
            <Text style={jobLabel}>Scheduled Date:</Text>
            <Text style={jobValue}>{scheduledDate}</Text>
          </>
        )}
      </Section>

      {action === "assigned" && (
        <Text style={text}>
          Please review the job details on the platform and prepare the necessary equipment.
        </Text>
      )}

      {action === "scheduled" && (
        <Text style={text}>
          Make sure to confirm your availability and review the weather conditions for the
          scheduled date.
        </Text>
      )}

      {action === "rescheduled" && (
        <Text style={text}>
          The job date has changed. Please confirm your availability for the new date.
        </Text>
      )}

      {action === "cancelled" && (
        <Text style={text}>
          This job has been cancelled. No action is required on your part.
        </Text>
      )}

      <Hr style={hr} />

      <Text style={textMuted}>
        You can view more details and manage this job from the ProDrones Hub platform.
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
  margin: "20px 0",
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

const statusBadge = {
  borderRadius: "6px",
  padding: "12px 20px",
  textAlign: "center" as const,
  margin: "0 0 24px 0",
};

const statusText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
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

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};
