import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "3D Viewer",
    template: "%s | ProDrones Viewer",
  },
  description:
    "Interactive 3D viewer for drone survey data — landscape models, construction progress, and community maps.",
  robots: { index: false, follow: false },
};

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
