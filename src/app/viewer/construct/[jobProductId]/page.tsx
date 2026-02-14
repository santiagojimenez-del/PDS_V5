"use client";

import { use } from "react";
import { ConstructViewer } from "@/modules/viewers/components/construct/construct-viewer";
import type { ViewerPageProps } from "@/modules/viewers/types";

export default function ConstructPage({ params }: ViewerPageProps) {
  const { jobProductId } = use(params);

  return <ConstructViewer jobProductId={jobProductId} />;
}
