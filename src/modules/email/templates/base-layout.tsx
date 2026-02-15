import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Hr,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

interface BaseLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

/**
 * Base email layout with ProDrones branding
 * All email templates should wrap their content with this component
 */
export function BaseLayout({ children, preview }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <meta name="preview" content={preview} />}
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={header}>
            <Text style={logoText}>ProDrones Hub</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} ProDrones Hub. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is an automated email. Please do not reply directly.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#8600FB", // ProDrones purple color from CLAUDE.md
  textAlign: "center" as const,
};

const logoText = {
  margin: "0",
  fontSize: "28px",
  fontWeight: "bold",
  color: "#ffffff",
  letterSpacing: "-0.5px",
};

const content = {
  padding: "24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  padding: "0 24px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "4px 0",
};
