import { AppShell } from "@/components/layout/app-shell";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell app="hub">{children}</AppShell>;
}
