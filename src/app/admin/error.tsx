"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconAlertTriangle, IconRefresh, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Admin] Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <IconAlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred in the admin panel. Try again or return to the dashboard.
          </p>
          {/* Always show details in admin — helpful for troubleshooting */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-mono text-muted-foreground break-words">
              {error.message || "Unknown error"}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground">Digest: {error.digest}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
