"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPackage, IconArrowLeft, IconMap } from "@tabler/icons-react";
import Link from "next/link";
import { VIEWER_PRODUCTS } from "@/lib/constants";

const VIEWER_TYPE_MAP: Record<number, string> = {
  [VIEWER_PRODUCTS.LANDSCAPE]: "landscape",
  [VIEWER_PRODUCTS.COMMUNITY]: "community",
  [VIEWER_PRODUCTS.CONSTRUCT]: "construct",
};

export default function ClientProductPage() {
  const params = useParams();
  const jobId = params.id as string;
  const productId = params.productId as string;
  const productIndex = parseInt(productId, 10);

  const jobProductId = `${jobId}-${productIndex}`;

  // Fetch viewer data to check if this product has a viewer
  const { data: viewerData, isLoading } = useQuery({
    queryKey: ["viewer", jobProductId],
    queryFn: async () => {
      const res = await fetch(`/api/viewer/${jobProductId}`);
      const json = await res.json();
      if (!json.success) return null;
      return json.data;
    },
  });

  const product = viewerData?.product;
  const viewerProductId = product?.id as number | undefined;
  const viewerType = viewerProductId ? VIEWER_TYPE_MAP[viewerProductId] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/client/job/${jobId}`} className="text-muted-foreground hover:text-foreground">
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Deliverable</h2>
          <p className="text-muted-foreground">Job #{jobId} - Product #{productId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            {product?.name ? String(product.name) : "Deliverable Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading product information...</p>
          ) : viewerType ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                This product has an interactive map viewer available. Click below to open the
                full-screen {viewerType} viewer with aerial imagery, drawing tools, and
                classification capabilities.
              </p>
              <Link href={`/viewer/${viewerType}/${jobProductId}`}>
                <Button className="gap-2">
                  <IconMap className="h-4 w-4" />
                  Open Map Viewer
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Deliverable content for this product will be displayed here.
              {viewerData?.deliverables && Object.keys(viewerData.deliverables).length > 0 && (
                <span className="block mt-2">
                  This product has {Object.keys(viewerData.deliverables).length} deliverable entries.
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
