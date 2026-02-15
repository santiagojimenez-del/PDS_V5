import { Text, Section, Heading, Button, Hr } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["reset-password"];

export function ResetPasswordEmail({ userName, resetLink, expiresInHours }: Props) {
  return (
    <BaseLayout preview="Reset your ProDrones Hub password">
      <Heading style={h1}>Reset Password</Heading>

      <Text style={text}>
        Hello <strong>{userName}</strong>,
      </Text>

      <Text style={text}>
        We received a request to reset the password for your ProDrones Hub account.
      </Text>

      <Text style={text}>
        Click the button below to create a new password:
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={resetLink}>
          Reset Password
        </Button>
      </Section>

      <Text style={textMuted}>
        Or copy and paste this link into your browser:
      </Text>

      <Text style={link}>{resetLink}</Text>

      <Hr style={hr} />

      <Text style={textMuted}>
        This link will expire in <strong>{expiresInHours} hours</strong>.
      </Text>

      <Text style={textMuted}>
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not be changed.
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
