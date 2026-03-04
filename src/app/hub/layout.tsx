import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Hub",
    template: "%s | Hub — ProDrones",
  },
  description:
    "Operations hub — manage workflow, jobs, sites, billing, onboarding, and scheduling for Professional Drone Solutions.",
  robots: { index: false, follow: false },
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell app="hub">{children}</AppShell>;
}
