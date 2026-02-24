"use client";

/**
 * /shared — Public shared page handler
 *
 * Accessed when a URL contains ?share_token=<token>.
 * The middleware rewrites any URL with that param to this page.
 *
 * Flow:
 *  1. Read share_token from searchParams
 *  2. Validate against /api/share/validate/[token]
 *  3. Based on page.template, render the appropriate viewer or content
 *  4. If token is invalid/expired → show error
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconShare, IconLock, IconAlertTriangle, IconExternalLink,
} from "@tabler/icons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShareData {
  shareId: number;
  token: string;
  expiresAt: number | null;
  user: { id: number; email: string; name: string };
  requestToken: string | null;
  page: {
    pageId: number;
    application: string;
    page: string;
    wrapper: string | null;
    template: string | null;
    design: string | null;
  };
}

type Status = "loading" | "valid" | "invalid" | "expired";

// ── Component ─────────────────────────────────────────────────────────────────

export default function SharedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    }>
      <SharedContent />
    </Suspense>
  );
}

function SharedContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("share_token");
  const [status,    setStatus]    = useState<Status>("loading");
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error,     setError]     = useState<string>("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); setError("No share token provided."); return; }

    fetch(`/api/share/validate/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          const msg = json.error || "Invalid share link";
          if (msg.toLowerCase().includes("expired")) {
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
          setError(msg);
        } else {
          setShareData(json.data);
          setStatus("valid");
        }
      })
      .catch(() => {
        setStatus("invalid");
        setError("Failed to validate share link.");
      });
  }, [token]);

  // ── Error states ─────────────────────────────────────────────────────────────
  if (status === "invalid" || status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              {status === "expired" ? (
                <IconLock className="h-12 w-12 text-muted-foreground" />
              ) : (
                <IconAlertTriangle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <h2 className="text-xl font-bold">
              {status === "expired" ? "Link Expired" : "Invalid Link"}
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link href="/login">
              <Button variant="outline" className="gap-2">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Valid share ───────────────────────────────────────────────────────────────
  if (!shareData) return null;

  const { page, expiresAt, requestToken } = shareData;
  const template = page.template?.toLowerCase() || "";

  // Build the viewer redirect URL based on template / page type
  let viewerPath: string | null = null;

  if (template.includes("landscape") || template.includes("ls_viewer")) {
    viewerPath = `/viewer/landscape/${requestToken || ""}`;
  } else if (template.includes("community") || template.includes("cm_viewer")) {
    viewerPath = `/viewer/community/${requestToken || ""}`;
  } else if (template.includes("construct") || template.includes("ct_viewer")) {
    viewerPath = `/viewer/construct/${requestToken || ""}`;
  }

  const formatExpiry = (ts: number | null) => {
    if (!ts) return "Never expires";
    const d = new Date(ts * 1000);
    return `Expires ${d.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <IconShare className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Shared Content</h1>
            <p className="text-sm text-muted-foreground">
              {shareData.user.name || shareData.user.email} has shared this with you.
            </p>
          </div>

          {/* Page info */}
          <div className="rounded-md border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Page</span>
              <span className="font-medium">{page.page}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">App</span>
              <Badge variant="outline">{page.application}</Badge>
            </div>
            {page.template && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary">{page.template}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Access</span>
              <span className="text-xs">{formatExpiry(expiresAt)}</span>
            </div>
          </div>

          {/* Viewer CTA */}
          {viewerPath ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Open this link to view the content directly in the viewer.
              </p>
              <Link href={viewerPath}>
                <Button className="w-full gap-2">
                  <IconExternalLink className="h-4 w-4" />
                  Open Viewer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                This content requires authentication to view.
              </p>
              <Link href={`/login?redirect=${encodeURIComponent(page.page)}`}>
                <Button className="w-full gap-2">
                  Log In to View
                </Button>
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Powered by ProDrones Hub
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
