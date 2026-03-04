import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // ── Server packages ───────────────────────────────────────────────────────
  serverExternalPackages: ["@react-pdf/renderer"],

  // ── Security / headers ────────────────────────────────────────────────────
  poweredByHeader: false,

  // ── Compression ───────────────────────────────────────────────────────────
  compress: true,

  // ── Image optimization ────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // ── Package import optimization (tree-shaking for icon libs) ─────────────
  // Tells Next.js to only bundle the icons actually imported instead of the
  // entire library, significantly reducing JS bundle size.
  experimental: {
    optimizePackageImports: [
      "@tabler/icons-react",
      "lucide-react",
      "@radix-ui/react-icons",
    ],
  },
};

// Bundle analyzer — run with: ANALYZE=true npm run build
const analyzed = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default withSentryConfig(analyzed, {
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  disableLogger: true,
  telemetry: false,
});
