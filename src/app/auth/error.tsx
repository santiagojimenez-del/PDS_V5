"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth] Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <IconAlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Unexpected error</h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading this page. Please try again.
        </p>
        <Button onClick={reset} className="w-full">
          <IconRefresh className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <a href="/login" className="block text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
          Return to login
        </a>
      </div>
    </div>
  );
}
