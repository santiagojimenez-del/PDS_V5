"use client";

import { useParams } from "next/navigation";
import { ConstructViewer } from "@/modules/viewers/components/construct/construct-viewer";

export default function ConstructPage() {
  const params = useParams();
  const jobProductId = params?.jobProductId as string;

  if (!jobProductId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Invalid viewer URL</p>
      </div>
    );
  }

  return <ConstructViewer jobProductId={jobProductId} />;
}
