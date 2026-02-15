import { Text, Section, Heading, Button, Hr } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "../base-layout";
import type { EmailTemplateData } from "../../types";

type Props = EmailTemplateData["signup-confirmation"];

export function SignupConfirmationEmail({ userName, confirmationLink }: Props) {
  return (
    <BaseLayout preview="Confirm your ProDrones Hub account">
      <Heading style={h1}>Welcome to ProDrones Hub!</Heading>

      <Text style={text}>
        Hello <strong>{userName}</strong>,
      </Text>

      <Text style={text}>
        Thank you for signing up for ProDrones Hub. We're excited to have you with us.
      </Text>

      <Text style={text}>
        To complete your registration and start using the platform, please confirm your
        email address by clicking the button below:
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={confirmationLink}>
          Confirm Email
        </Button>
      </Section>

      <Text style={textMuted}>
        Or copy and paste this link into your browser:
      </Text>

      <Text style={link}>{confirmationLink}</Text>

      <Hr style={hr} />

      <Text style={text}>
        Once your email is confirmed, you'll have access to all platform features:
      </Text>

      <ul style={list}>
        <li style={listItem}>Complete job and project management</li>
        <li style={listItem}>Real-time flight tracking</li>
        <li style={listItem}>Delivery and billing system</li>
        <li style={listItem}>Tileset and map visualization</li>
      </ul>

      <Text style={textMuted}>
        If you didn't create this account, you can safely ignore this email.
      </Text>

      <Text style={text}>
        Welcome aboard!
        <br />
        The ProDrones Hub Team
      </Text>
    </BaseLayout>
  );
}

// Styles remain the same
const h1 = { color: "#333", fontSize: "24px", fontWeight: "bold", margin: "0 0 20px", padding: "0" };
const text = { color: "#333", fontSize: "16px", lineHeight: "24px", margin: "16px 0" };
const textMuted = { color: "#8898aa", fontSize: "14px", lineHeight: "20px", margin: "16px 0" };
const buttonContainer = { margin: "32px 0", textAlign: "center" as const };
const button = { backgroundColor: "#8600FB", borderRadius: "6px", color: "#fff", fontSize: "16px", fontWeight: "600", textDecoration: "none", textAlign: "center" as const, display: "inline-block", padding: "12px 32px" };
const link = { color: "#8600FB", fontSize: "14px", wordBreak: "break-all" as const, margin: "8px 0" };
const hr = { borderColor: "#e6ebf1", margin: "24px 0" };
const list = { paddingLeft: "20px", margin: "16px 0" };
const listItem = { color: "#333", fontSize: "16px", lineHeight: "28px", margin: "8px 0" };
