import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobProductId: string }>;
}): Promise<Metadata> {
  const { jobProductId } = await params;

  return {
    title: `Community Map #${jobProductId}`,
    description:
      "Interactive community map generated from drone survey data.",
    robots: { index: false, follow: false },
  };
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
