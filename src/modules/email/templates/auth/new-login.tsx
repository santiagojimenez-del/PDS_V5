import { Text, Section, Heading, Hr, Button } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["new-login"];

export function NewLoginEmail({ userName, ipAddress, browser, loginAt, manageSessionsUrl }: Props) {
  return (
    <BaseLayout preview="New login detected on your ProDrones Hub account">
      <Heading style={h1}>New Login Detected</Heading>

      <Text style={text}>
        Hello <strong>{userName}</strong>,
      </Text>

      <Text style={text}>
        We noticed a new login to your ProDrones Hub account from a location or device
        we haven&apos;t seen before.
      </Text>

      <Section style={infoBox}>
        <Text style={infoLabel}>Login Details</Text>
        <Text style={infoText}>
          <strong>Date &amp; Time:</strong> {loginAt}
        </Text>
        <Text style={infoText}>
          <strong>IP Address:</strong> {ipAddress}
        </Text>
        <Text style={infoText}>
          <strong>Browser / Device:</strong> {browser}
        </Text>
      </Section>

      <Text style={text}>
        If this was you, no action is needed.
      </Text>

      <Section style={alertBox}>
        <Text style={alertText}>
          <strong>Wasn&apos;t you?</strong> If you did not log in, your account may be
          compromised. Secure your account immediately by reviewing your active sessions
          and changing your password.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={manageSessionsUrl} style={button}>
          Review Active Sessions
        </Button>
      </Section>

      <Hr style={hr} />

      <Text style={textMuted}>
        For your security, consider enabling two-factor authentication (2FA) in your
        account settings. If you need help, contact us at{" "}
        <a href="mailto:support@prodrones.com" style={link}>
          support@prodrones.com
        </a>
        .
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

const infoBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const infoLabel = {
  color: "#6c757d",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  margin: "0 0 12px",
};

const infoText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "6px 0",
};

const alertBox = {
  backgroundColor: "#fff5f5",
  borderLeft: "4px solid #dc3545",
  borderRadius: "4px",
  padding: "12px 16px",
  margin: "16px 0",
};

const alertText = {
  color: "#dc3545",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0",
};

const button = {
  backgroundColor: "#ff6600",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "bold",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const link = {
  color: "#ff6600",
  textDecoration: "underline",
};
