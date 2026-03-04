import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobProductId: string }>;
}): Promise<Metadata> {
  const { jobProductId } = await params;

  return {
    title: `Landscape Survey #${jobProductId}`,
    description:
      "Interactive 3D landscape model generated from drone survey data.",
    robots: { index: false, follow: false },
  };
}

export default function LandscapeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
