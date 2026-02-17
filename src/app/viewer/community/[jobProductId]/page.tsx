"use client";

import { useParams } from "next/navigation";
import { CommunityViewer } from "@/modules/viewers/components/community/community-viewer";

export default function CommunityPage() {
  const params = useParams();
  const jobProductId = params?.jobProductId as string;

  if (!jobProductId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Invalid viewer URL</p>
      </div>
    );
  }

  return <CommunityViewer jobProductId={jobProductId} />;
}
