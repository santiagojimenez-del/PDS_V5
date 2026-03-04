import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin — ProDrones",
  },
  description: "Administration panel — manage users, roles, permissions, and platform configuration.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell app="admin">{children}</AppShell>;
}
