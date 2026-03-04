import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Client Portal",
    template: "%s | Client Portal — ProDrones",
  },
  description:
    "Client portal — view your drone survey jobs, deliverables, and site information.",
  robots: { index: false, follow: false },
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell app="client">{children}</AppShell>;
}
