import { Text, Section, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["2fa-code"];

export function TwoFactorCodeEmail({ code, userName, expiresInMinutes }: Props) {
  return (
    <BaseLayout preview={`Your verification code: ${code}`}>
      <Heading style={h1}>Verification Code</Heading>

      <Text style={text}>
        Hello <strong>{userName}</strong>,
      </Text>

      <Text style={text}>
        You've requested to access your ProDrones Hub account. Use the following verification code to continue:
      </Text>

      <Section style={codeContainer}>
        <Text style={codeStyle}>{code}</Text>
      </Section>

      <Text style={text}>
        This code will expire in <strong>{expiresInMinutes} minutes</strong>.
      </Text>

      <Text style={textMuted}>
        If you didn't request this code, you can safely ignore this email.
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

const codeContainer = {
  background: "#f4f4f4",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const codeStyle = {
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "8px",
  color: "#8600FB",
  fontFamily: "monospace",
};
