"use client";

/**
 * ShareModal
 *
 * Allows staff/admin users to generate share links for shareable pages.
 * Features:
 *  - Choose expiry: 1h / 24h / 7d / 30d / Never
 *  - Copy link to clipboard
 *  - View all existing shares for this page
 *  - Revoke any share
 *
 * Usage:
 *   <ShareModal pageId={123} />
 *   <ShareModal pageId={123} requestToken="abc123" />
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconShare,
  IconCopy,
  IconCheck,
  IconTrash,
  IconClock,
  IconLock,
  IconExternalLink,
} from "@tabler/icons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Expiry = "1h" | "24h" | "7d" | "30d" | "never";

interface ShareEntry {
  shareId:      number;
  token:        string;
  expiresAt:    number | null;
  expired:      boolean;
  user:         { id: number; email: string; name: string };
  requestToken: string | null;
}

interface ShareModalProps {
  /** pageId from the Pages table */
  pageId: number;
  /** Optional request token to embed in the share (for parameterized pages) */
  requestToken?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPIRY_OPTIONS: { value: Expiry; label: string }[] = [
  { value: "1h",    label: "1 hour" },
  { value: "24h",   label: "24 hours" },
  { value: "7d",    label: "7 days" },
  { value: "30d",   label: "30 days" },
  { value: "never", label: "Never expires" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildShareUrl(token: string, requestToken?: string | null): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ share_token: token });
  if (requestToken) params.set("request", requestToken);
  return `${base}?${params.toString()}`;
}

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) return "Never expires";
  const date = new Date(expiresAt * 1000);
  const now   = Date.now();
  const diff  = expiresAt * 1000 - now;

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `Expires in ${hours}h`;

  const days = Math.floor(hours / 24);
  return `Expires in ${days}d (${date.toLocaleDateString()})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShareModal({ pageId, requestToken, open, onOpenChange }: ShareModalProps) {
  const [expiry,       setExpiry]       = useState<Expiry>("7d");
  const [creating,     setCreating]     = useState(false);
  const [revoking,     setRevoking]     = useState<number | null>(null);
  const [shares,       setShares]       = useState<ShareEntry[]>([]);
  const [loadingList,  setLoadingList]  = useState(false);
  const [newShareUrl,  setNewShareUrl]  = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  // ── Load existing shares ───────────────────────────────────────────────────
  const loadShares = useCallback(async () => {
    setLoadingList(true);
    try {
      const res  = await fetch(`/api/share?pageId=${pageId}`);
      const json = await res.json();
      if (json.success) {
        setShares(json.data.shares);
      }
    } catch {
      // silent — list is optional
    } finally {
      setLoadingList(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open) {
      setNewShareUrl(null);
      setCopied(false);
      loadShares();
    }
  }, [open, loadShares]);

  // ── Create share ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res  = await fetch("/api/share", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pageId, expiry, requestToken }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to create share link");
        return;
      }

      const url = buildShareUrl(json.data.token, requestToken);
      setNewShareUrl(url);
      toast.success("Share link created");
      loadShares();
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  // ── Revoke share ───────────────────────────────────────────────────────────
  const handleRevoke = async (shareId: number) => {
    setRevoking(shareId);
    try {
      const res  = await fetch("/api/share", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ shareId }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to revoke link");
        return;
      }

      toast.success("Share link revoked");
      setShares((prev) => prev.filter((s) => s.shareId !== shareId));
      if (newShareUrl) {
        // If the revoked share was the one we just created, clear it
        setNewShareUrl(null);
      }
    } catch {
      toast.error("Failed to revoke link");
    } finally {
      setRevoking(null);
    }
  };

  const activeShares  = shares.filter((s) => !s.expired);
  const expiredShares = shares.filter((s) => s.expired);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconShare className="h-5 w-5 text-primary" />
            Share Link
          </DialogTitle>
          <DialogDescription>
            Create a shareable link. Anyone with the link can view this page.
          </DialogDescription>
        </DialogHeader>

        {/* ── Create new share ── */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Link expiry</Label>
            <Select value={expiry} onValueChange={(v) => setExpiry(v as Expiry)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCreate} disabled={creating} className="w-full">
            <IconShare className="h-4 w-4 mr-2" />
            {creating ? "Creating…" : "Generate Share Link"}
          </Button>
        </div>

        {/* ── New share result ── */}
        {newShareUrl && (
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <IconCheck className="h-3.5 w-3.5 text-green-500" />
              Link ready — copy and share it
            </p>
            <div className="flex gap-2">
              <Input
                value={newShareUrl}
                readOnly
                className="font-mono text-xs h-8"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => handleCopy(newShareUrl)}
              >
                {copied ? (
                  <IconCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <IconCopy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => window.open(newShareUrl, "_blank")}
              >
                <IconExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Existing shares list ── */}
        {(activeShares.length > 0 || expiredShares.length > 0) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active links ({activeShares.length})
              </p>

              {loadingList ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeShares.map((share) => (
                    <div
                      key={share.shareId}
                      className="flex items-center gap-2 rounded-md border bg-background p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate text-muted-foreground">
                          {buildShareUrl(share.token, share.requestToken)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <IconClock className="h-3 w-3" />
                          {formatExpiry(share.expiresAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 shrink-0"
                        title="Copy link"
                        onClick={() =>
                          handleCopy(buildShareUrl(share.token, share.requestToken))
                        }
                      >
                        <IconCopy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
                        title="Revoke link"
                        disabled={revoking === share.shareId}
                        onClick={() => handleRevoke(share.shareId)}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {expiredShares.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                      <IconLock className="h-3 w-3" />
                      {expiredShares.length} expired link
                      {expiredShares.length > 1 ? "s" : ""} (auto-cleaned on next validation)
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
