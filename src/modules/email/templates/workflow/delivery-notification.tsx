import { Text, Section, Heading, Button, Hr } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["delivery-notification"];

export function DeliveryNotificationEmail({
  clientName,
  jobId,
  jobTitle,
  deliveryDate,
  downloadLink,
}: Props) {
  return (
    <BaseLayout preview={`Your project has been delivered - Job #${jobId}`}>
      <Section style={successBadge}>
        <Text style={badgeText}>✓ DELIVERY COMPLETED</Text>
      </Section>

      <Heading style={h1}>Hello {clientName},</Heading>

      <Text style={text}>
        Great news! Your project has been completed and the results are ready for
        download.
      </Text>

      <Section style={jobCard}>
        <Text style={jobLabel}>Job ID:</Text>
        <Text style={jobValue}>#{jobId}</Text>

        <Text style={jobLabel}>Project:</Text>
        <Text style={jobValue}>{jobTitle}</Text>

        <Text style={jobLabel}>Delivery Date:</Text>
        <Text style={jobValue}>{deliveryDate}</Text>
      </Section>

      {downloadLink ? (
        <>
          <Text style={text}>
            Your project files are available for download. Click the button below to access them:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={downloadLink}>
              Download Files
            </Button>
          </Section>

          <Text style={textMuted}>
            Or copy and paste this link into your browser:
          </Text>

          <Text style={link}>{downloadLink}</Text>
        </>
      ) : (
        <Text style={text}>
          Your project files are available on the ProDrones Hub platform. Please log in to access
          the results.
        </Text>
      )}

      <Hr style={hr} />

      <Section style={infoBox}>
        <Text style={infoTitle}>📦 What's included in this delivery?</Text>
        <Text style={infoText}>
          The files may include high-resolution images, orthomosaics, 3D models,
          point clouds, and other products as agreed upon in the project.
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={text}>
        If you have any questions about the results or need additional assistance, please don't
        hesitate to contact us.
      </Text>

      <Text style={textMuted}>
        Thank you for trusting ProDrones Hub with your project.
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

const successBadge = {
  backgroundColor: "#00875a",
  borderRadius: "6px",
  padding: "12px 20px",
  textAlign: "center" as const,
  margin: "0 0 24px 0",
};

const badgeText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
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

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#8600FB",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const link = {
  color: "#8600FB",
  fontSize: "14px",
  wordBreak: "break-all" as const,
  margin: "8px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const infoBox = {
  backgroundColor: "#f0f7ff",
  borderLeft: "4px solid #0070f3",
  borderRadius: "4px",
  padding: "16px",
  margin: "20px 0",
};

const infoTitle = {
  color: "#0070f3",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const infoText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};
