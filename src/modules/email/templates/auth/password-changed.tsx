import { Text, Section, Heading, Hr } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["password-changed"];

export function PasswordChangedEmail({ userName, changedAt, ipAddress }: Props) {
  return (
    <BaseLayout preview="Your ProDrones Hub password was changed">
      <Heading style={h1}>Password Changed</Heading>

      <Text style={text}>
        Hello <strong>{userName}</strong>,
      </Text>

      <Text style={text}>
        This is a confirmation that your ProDrones Hub account password was successfully changed.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>Changed at:</strong> {changedAt}
        </Text>
        <Text style={infoText}>
          <strong>IP Address:</strong> {ipAddress}
        </Text>
      </Section>

      <Hr style={hr} />

      <Text style={alertText}>
        <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately.
      </Text>

      <Text style={textMuted}>
        For your security, we recommend that you:
      </Text>

      <ul style={list}>
        <li style={listItem}>Use a strong, unique password</li>
        <li style={listItem}>Enable two-factor authentication</li>
        <li style={listItem}>Never share your password with anyone</li>
      </ul>

      <Hr style={hr} />

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

const alertText = {
  color: "#dc3545",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "16px 0",
  padding: "12px",
  backgroundColor: "#fff5f5",
  borderLeft: "4px solid #dc3545",
  borderRadius: "4px",
};

const infoBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const infoText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const list = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  paddingLeft: "20px",
};

const listItem = {
  margin: "8px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};
