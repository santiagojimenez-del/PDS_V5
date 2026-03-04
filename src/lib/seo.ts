/**
 * SEO utilities — shared metadata builder for all sections.
 *
 * Usage:
 *   import { buildMetadata, APP_URL, SITE_NAME } from "@/lib/seo";
 *   export const metadata = buildMetadata({ title: "Jobs", description: "..." });
 */

import type { Metadata } from "next";

export const SITE_NAME = "ProDrones Hub";
export const SITE_DESCRIPTION =
  "Internal operations platform for Professional Drone Solutions — manage jobs, sites, pilots, billing, and more.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://hub.prodrones.com";

/**
 * Builds a fully-populated Metadata object. All fields are optional and
 * fall back to sensible site-wide defaults.
 */
export function buildMetadata(overrides: {
  title?: string;
  description?: string;
  /** Suffix appended to title, e.g. "| ProDrones Hub". Pass false to suppress. */
  suffix?: string | false;
  /** Canonical URL path, e.g. "/hub/workflow/jobs" */
  path?: string;
  /** Should this page be indexed by search engines? Default: false (internal app). */
  index?: boolean;
  /** OG image path relative to /public. Defaults to /img/og-default.png */
  ogImage?: string;
  /** Additional keywords */
  keywords?: string[];
}): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    suffix,
    path,
    index = false,
    ogImage = "/img/PDSLogo1-xsm.png",
    keywords = [],
  } = overrides;

  const pageTitle =
    title === undefined
      ? SITE_NAME
      : suffix === false
        ? title
        : `${title} | ${SITE_NAME}`;

  const canonical = path ? `${APP_URL}${path}` : APP_URL;
  const ogImageUrl = ogImage.startsWith("http") ? ogImage : `${APP_URL}${ogImage}`;

  return {
    title: pageTitle,
    description,
    keywords: ["drone", "UAV", "aerial survey", "prodrones", ...keywords].join(", "),
    authors: [{ name: "Professional Drone Solutions" }],
    creator: "Professional Drone Solutions",
    metadataBase: new URL(APP_URL),
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false } },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: SITE_NAME }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}
