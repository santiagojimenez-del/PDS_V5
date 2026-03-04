import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project (set via SENTRY_ORG / SENTRY_PROJECT env vars)
  silent: !process.env.CI,

  // Upload source maps to Sentry only when SENTRY_AUTH_TOKEN is present
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Disable source map upload when token is not set (local dev / CI without token)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,

  // Suppress the Sentry banner in terminal output
  telemetry: false,
});
