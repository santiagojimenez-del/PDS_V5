"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import type { ViewerPageProps } from "@/modules/viewers/types";

const LandscapeViewer = dynamic(
  () => import("@/modules/viewers/components/landscape/landscape-viewer").then((mod) => mod.LandscapeViewer),
  { ssr: false }
);

export default function LandscapePage({ params }: ViewerPageProps) {
  const { jobProductId } = use(params);

  return <LandscapeViewer jobProductId={jobProductId} />;
}
