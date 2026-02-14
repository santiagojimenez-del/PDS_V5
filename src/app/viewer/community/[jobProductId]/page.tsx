"use client";

import { use } from "react";
import { CommunityViewer } from "@/modules/viewers/components/community/community-viewer";
import type { ViewerPageProps } from "@/modules/viewers/types";

export default function CommunityPage({ params }: ViewerPageProps) {
  const { jobProductId } = use(params);

  return <CommunityViewer jobProductId={jobProductId} />;
}
