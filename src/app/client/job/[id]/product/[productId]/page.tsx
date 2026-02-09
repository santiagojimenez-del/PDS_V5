"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPackage, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function ClientProductPage() {
  const params = useParams();
  const jobId = params.id as string;
  const productId = params.productId as string;

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
            Deliverable Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Product deliverable viewer will be available once the Map Viewers module (Phase 4) is implemented.
            This page will display the interactive map viewer with the deliverable content for this product.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
