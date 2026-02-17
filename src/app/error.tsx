"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconAlertTriangle, IconHome, IconRefresh } from "@tabler/icons-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <IconAlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-2xl font-bold text-foreground">Something Went Wrong</h1>

            {/* Description */}
            <p className="mb-6 text-muted-foreground">
              We encountered an unexpected error. This issue has been logged and we'll look into it.
              You can try refreshing the page or return home.
            </p>

            {/* Error Details (Dev Mode) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 rounded-lg bg-muted p-4 text-left">
                <p className="mb-2 text-sm font-semibold text-foreground">Error Details:</p>
                <p className="text-xs text-muted-foreground break-words">
                  {error.message || "Unknown error"}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset} className="w-full sm:w-auto">
                <IconRefresh className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full sm:w-auto"
              >
                <IconHome className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact support at{" "}
                <a href="mailto:support@prodrones.com" className="text-primary hover:underline">
                  support@prodrones.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
