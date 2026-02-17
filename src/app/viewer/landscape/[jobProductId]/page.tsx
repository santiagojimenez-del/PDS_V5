"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const LandscapeViewer = dynamic(
  () => import("@/modules/viewers/components/landscape/landscape-viewer").then((mod) => mod.LandscapeViewer),
  { ssr: false }
);

export default function LandscapePage() {
  const params = useParams();
  const jobProductId = params?.jobProductId as string;

  if (!jobProductId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Invalid viewer URL</p>
      </div>
    );
  }

  return <LandscapeViewer jobProductId={jobProductId} />;
}
