"use client";

/**
 * Organization Detail Page
 *
 * Route: /hub/onboard/company/manage/[id]
 *
 * Shows:
 * - Organization info (editable)
 * - Contacts list with primary badge
 * - Add contact (by user ID or email search)
 * - Remove contact / make primary
 * - Archive / unarchive
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconBuilding,
  IconArrowLeft,
  IconUsers,
  IconUserPlus,
  IconTrash,
  IconStar,
  IconEdit,
  IconCheck,
  IconX,
  IconArchive,
  IconArchiveOff,
  IconBriefcase,
} from "@tabler/icons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgDetail {
  id: number;
  name: string;
  address: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logo: string | null;
  jobCount: number;
  archived: boolean;
}

interface ContactEntry {
  user_id: number;
  primary: boolean;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const orgId   = Number(params.id);

  const [org,          setOrg]          = useState<OrgDetail | null>(null);
  const [contacts,     setContacts]     = useState<ContactEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [editForm,     setEditForm]     = useState({ name: "", address: "", streetAddress: "", city: "", state: "", zipCode: "" });
  const [addUserId,    setAddUserId]    = useState("");
  const [addEmail,     setAddEmail]     = useState("");
  const [adding,       setAdding]       = useState(false);
  const [removingId,   setRemovingId]   = useState<number | null>(null);
  const [primaryId,    setPrimaryId]    = useState<number | null>(null);
  const [archiving,    setArchiving]    = useState(false);

  // ── Fetch org + contacts ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, ctRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}`),
        fetch(`/api/organizations/${orgId}/contacts`),
      ]);

      if (!orgRes.ok) {
        toast.error("Organization not found");
        router.push("/hub/onboard/company/manage");
        return;
      }

      const orgJson = await orgRes.json();
      const o = orgJson.data.organization;
      setOrg(o);
      setEditForm({
        name:          o.name          || "",
        address:       o.address       || "",
        streetAddress: o.streetAddress || "",
        city:          o.city          || "",
        state:         o.state         || "",
        zipCode:       o.zipCode       || "",
      });

      if (ctRes.ok) {
        const ctJson = await ctRes.json();
        setContacts(ctJson.data.contacts || []);
      }
    } catch {
      toast.error("Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [orgId, router]);

  useEffect(() => { load(); }, [load]);

  // ── Save org info ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`/api/organizations/${orgId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          editForm.name          || undefined,
          address:       editForm.address       || undefined,
          streetAddress: editForm.streetAddress || undefined,
          city:          editForm.city          || undefined,
          state:         editForm.state         || undefined,
          zipCode:       editForm.zipCode       || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update organization");
        return;
      }
      const o = json.data.organization;
      setOrg(o);
      setEditing(false);
      toast.success("Organization updated");
    } catch {
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  // ── Add contact ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const rawId   = addUserId.trim();
    const rawEmail = addEmail.trim();

    let userId: number | null = null;

    if (rawId) {
      userId = parseInt(rawId, 10);
      if (isNaN(userId)) {
        toast.error("Invalid user ID");
        return;
      }
    } else if (rawEmail) {
      // Look up user by email via admin search
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(rawEmail)}`);
        const json = await res.json();
        const hit  = json.results?.find(
          (r: { type: string; subtitle: string; id: number }) =>
            r.type === "user" && r.subtitle?.toLowerCase() === rawEmail.toLowerCase()
        );
        if (!hit) {
          toast.error("No user found with that email");
          return;
        }
        userId = hit.id;
      } catch {
        toast.error("User lookup failed");
        return;
      }
    } else {
      toast.error("Enter a user ID or email");
      return;
    }

    setAdding(true);
    try {
      const res  = await fetch(`/api/organizations/${orgId}/contacts`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to add contact");
        return;
      }
      setContacts(json.data.contacts);
      setAddUserId("");
      setAddEmail("");
      toast.success("Contact added");
      // refresh org to update contactCount
      const oRes  = await fetch(`/api/organizations/${orgId}`);
      const oJson = await oRes.json();
      if (oRes.ok) setOrg(oJson.data.organization);
    } catch {
      toast.error("Failed to add contact");
    } finally {
      setAdding(false);
    }
  };

  // ── Remove contact ─────────────────────────────────────────────────────────
  const handleRemove = async (userId: number) => {
    setRemovingId(userId);
    try {
      const res  = await fetch(`/api/organizations/${orgId}/contacts`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to remove contact");
        return;
      }
      setContacts(json.data.contacts);
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    } finally {
      setRemovingId(null);
    }
  };

  // ── Make primary ───────────────────────────────────────────────────────────
  const handleMakePrimary = async (userId: number) => {
    setPrimaryId(userId);
    try {
      const res  = await fetch(`/api/organizations/${orgId}/contacts`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update primary contact");
        return;
      }
      setContacts(json.data.contacts);
      toast.success("Primary contact updated");
    } catch {
      toast.error("Failed to update primary contact");
    } finally {
      setPrimaryId(null);
    }
  };

  // ── Archive / Unarchive ────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!org) return;
    setArchiving(true);
    try {
      const method = org.archived ? "DELETE" : "POST";
      const res    = await fetch(`/api/organizations/${orgId}/archive`, { method });
      const json   = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update archive status");
        return;
      }
      setOrg((prev) => prev ? { ...prev, archived: !prev.archived } : prev);
      toast.success(org.archived ? "Organization unarchived" : "Organization archived");
    } catch {
      toast.error("Failed to update archive status");
    } finally {
      setArchiving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (!org) return null;

  const primaryContact = contacts.find((c) => c.primary);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hub/onboard/company/manage">
            <Button variant="ghost" size="sm" className="gap-1">
              <IconArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <IconBuilding className="h-6 w-6 text-primary" />
              {org.name}
              {org.archived && (
                <Badge variant="secondary" className="text-xs">Archived</Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {org.jobCount} job{org.jobCount !== 1 ? "s" : ""} · {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
              {primaryContact && ` · Primary: ${primaryContact.fullName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={archiving}
            className="gap-1"
          >
            {org.archived
              ? <><IconArchiveOff className="h-4 w-4" /> Unarchive</>
              : <><IconArchive className="h-4 w-4" /> Archive</>
            }
          </Button>
        </div>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <IconBuilding className="h-4 w-4" />
              Organization Info
            </CardTitle>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1">
                <IconEdit className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1">
                  <IconX className="h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                  <IconCheck className="h-4 w-4" />
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!editing ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Name</p>
                <p>{org.name}</p>
              </div>
              {org.address && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Address</p>
                  <p>{org.address}</p>
                </div>
              )}
              {org.streetAddress && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Street Address</p>
                  <p>{org.streetAddress}</p>
                </div>
              )}
              {(org.city || org.state || org.zipCode) && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">City / State / Zip</p>
                  <p>{[org.city, org.state, org.zipCode].filter(Boolean).join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Company Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  placeholder="General address"
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Street Address</Label>
                <Input
                  placeholder="Street address"
                  value={editForm.streetAddress}
                  onChange={(e) => setEditForm((p) => ({ ...p, streetAddress: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  placeholder="City"
                  value={editForm.city}
                  onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input
                    placeholder="ST"
                    maxLength={2}
                    value={editForm.state}
                    onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Zip</Label>
                  <Input
                    placeholder="00000"
                    value={editForm.zipCode}
                    onChange={(e) => setEditForm((p) => ({ ...p, zipCode: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <IconUsers className="h-4 w-4" />
            Contacts
            <Badge variant="secondary">{contacts.length}</Badge>
          </CardTitle>
          <CardDescription>
            Manage the people associated with this organization. The primary contact is the main point of contact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Add contact */}
          <div className="rounded-md border bg-muted/30 p-3 space-y-3">
            <p className="text-sm font-medium flex items-center gap-1">
              <IconUserPlus className="h-4 w-4" />
              Add Contact
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">User ID</Label>
                <Input
                  type="number"
                  placeholder="e.g. 42"
                  value={addUserId}
                  onChange={(e) => { setAddUserId(e.target.value); setAddEmail(""); }}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Or Email</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => { setAddEmail(e.target.value); setAddUserId(""); }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding || (!addUserId.trim() && !addEmail.trim())}
              className="gap-1"
            >
              <IconUserPlus className="h-4 w-4" />
              {adding ? "Adding…" : "Add Contact"}
            </Button>
          </div>

          <Separator />

          {/* Contacts list */}
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contacts yet. Add the first one above.
            </p>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.user_id}
                  className="flex items-center gap-3 rounded-md border bg-background p-3"
                >
                  {/* Avatar placeholder */}
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {c.firstName ? c.firstName[0].toUpperCase() : c.email[0]?.toUpperCase() || "?"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{c.fullName}</p>
                      {c.primary && (
                        <Badge variant="default" className="text-xs h-4 px-1">
                          <IconStar className="h-2.5 w-2.5 mr-0.5" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!c.primary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Make primary contact"
                        disabled={primaryId === c.user_id}
                        onClick={() => handleMakePrimary(c.user_id)}
                      >
                        <IconStar className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}

                    <Link href={`/admin/users/${c.user_id}`}>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View user profile">
                        <IconBriefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Remove contact"
                          disabled={removingId === c.user_id}
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove contact?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{c.fullName}</strong> as a contact of this organization.
                            {c.primary && contacts.length > 1 && (
                              " The next contact in the list will automatically become primary."
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(c.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
