import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobProductId: string }>;
}): Promise<Metadata> {
  const { jobProductId } = await params;

  return {
    title: `Construction Progress #${jobProductId}`,
    description:
      "Interactive 3D construction progress model generated from drone survey data.",
    robots: { index: false, follow: false },
  };
}

export default function ConstructLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
