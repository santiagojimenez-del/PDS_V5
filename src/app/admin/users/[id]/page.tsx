"use client";

/**
 * Admin User Detail Page
 * /admin/users/[id]
 *
 * Features:
 * - View & edit profile (name, phone)
 * - Edit roles (checkboxes)
 * - Edit permissions (checkboxes, grouped by category)
 * - Change password
 * - Kill all sessions
 * - Delete user
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconUser, IconMail, IconPhone, IconShieldCheck, IconBriefcase,
  IconMapPin, IconArrowLeft, IconEdit, IconCheck, IconX,
  IconKey, IconLogout, IconTrash, IconLoader2, IconLock,
} from "@tabler/icons-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserDetail {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: number[];
  permissions: string[];
  phoneNumber: string | null;
  twoFactorEnabled: boolean;
  googleAddonLinked: boolean;
  jobsCreated: number;
  sitesCreated: number;
  recentJobs: { id: number; name: string; pipeline: string }[];
  recentSites: { id: number; name: string }[];
}

interface PermissionEntry {
  name: string;
  category: string;
  label: string;
  description: string | null;
  hidden: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { id: number; label: string; color: string }[] = [
  { id: 0, label: "Admin",      color: "bg-red-500" },
  { id: 1, label: "Client",     color: "bg-blue-500" },
  { id: 3, label: "Registered", color: "bg-gray-500" },
  { id: 4, label: "Developer",  color: "bg-purple-500" },
  { id: 5, label: "Staff",      color: "bg-green-500" },
  { id: 6, label: "Pilot",      color: "bg-yellow-500" },
  { id: 7, label: "Manager",    color: "bg-orange-500" },
];

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchUser(id: string): Promise<UserDetail> {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  const json = await res.json();
  return json.data as UserDetail;
}

async function fetchAllPermissions(): Promise<{ permissions: PermissionEntry[]; categories: Record<string, PermissionEntry[]> }> {
  const res = await fetch("/api/admin/permissions");
  if (!res.ok) throw new Error("Failed to fetch permissions");
  const json = await res.json();
  return json.data;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params      = useParams();
  const router      = useRouter();
  const qc          = useQueryClient();
  const id          = params.id as string;

  // UI state
  const [editingProfile,  setEditingProfile]  = useState(false);
  const [editingRoles,    setEditingRoles]    = useState(false);
  const [editingPerms,    setEditingPerms]    = useState(false);
  const [showPwdDialog,   setShowPwdDialog]   = useState(false);
  const [saving,          setSaving]          = useState(false);

  // Edit buffers
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phoneNumber: "" });
  const [draftRoles,  setDraftRoles]  = useState<number[]>([]);
  const [draftPerms,  setDraftPerms]  = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [pwdConfirm,  setPwdConfirm]  = useState("");

  // Queries
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => fetchUser(id),
  });

  const { data: allPerms } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: fetchAllPermissions,
    staleTime: 10 * 60 * 1000,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["admin-user", id] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }, [qc, id]);

  async function callPUT(payload: object) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  }

  async function callPATCH(payload: object) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  const startEditProfile = () => {
    if (!user) return;
    setProfileForm({
      firstName:   user.firstName,
      lastName:    user.lastName,
      phoneNumber: user.phoneNumber || "",
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await callPUT(profileForm);
      toast.success("Profile updated");
      setEditingProfile(false);
      invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const startEditRoles = () => {
    if (!user) return;
    setDraftRoles([...user.roles]);
    setEditingRoles(true);
  };

  const saveRoles = async () => {
    setSaving(true);
    try {
      await callPUT({ roles: draftRoles });
      toast.success("Roles updated");
      setEditingRoles(false);
      invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const startEditPerms = () => {
    if (!user) return;
    setDraftPerms([...user.permissions]);
    setEditingPerms(true);
  };

  const savePerms = async () => {
    setSaving(true);
    try {
      await callPUT({ permissions: draftPerms });
      toast.success("Permissions updated");
      setEditingPerms(false);
      invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKillSessions = async () => {
    setSaving(true);
    try {
      await callPATCH({ action: "kill-sessions" });
      toast.success("All sessions terminated");
      invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== pwdConfirm) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 8) { toast.error("Minimum 8 characters"); return; }
    setSaving(true);
    try {
      await callPATCH({ action: "change-password", newPassword });
      toast.success("Password changed and sessions terminated");
      setShowPwdDialog(false);
      setNewPassword("");
      setPwdConfirm("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to delete"); return; }
      toast.success("User deleted");
      router.push("/admin/users/search");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  // ── Toggle helpers ────────────────────────────────────────────────────────────

  const toggleRole = (roleId: number) => {
    setDraftRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const togglePerm = (perm: string) => {
    setDraftPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <p className="py-8 text-center text-muted-foreground">User not found.</p>;
  }

  return (
    <div className="space-y-4 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/users/search">
            <Button variant="ghost" size="sm" className="gap-1">
              <IconArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{user.fullName || user.email}</h2>
            <p className="text-sm text-muted-foreground">User #{user.id}</p>
          </div>
        </div>

        {/* Danger actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowPwdDialog(true)}>
            <IconKey className="h-4 w-4" /> Password
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <IconLogout className="h-4 w-4" /> Kill Sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kill all sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will log out <strong>{user.fullName || user.email}</strong> from all devices immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleKillSessions}>Kill Sessions</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1">
                <IconTrash className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                <AlertDialogDescription className="text-destructive">
                  This permanently deletes <strong>{user.email}</strong> and all their metadata.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <IconUser className="h-4 w-4" /> Profile
              </CardTitle>
              {!editingProfile ? (
                <Button variant="ghost" size="sm" onClick={startEditProfile} className="gap-1">
                  <IconEdit className="h-4 w-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)} className="gap-1">
                    <IconX className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={saveProfile} disabled={saving} className="gap-1">
                    {saving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <IconMail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{user.email}</span>
            </div>

            {!editingProfile ? (
              <>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <IconShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>2FA: {user.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="text-muted-foreground">
                  Google: {user.googleAddonLinked ? "Linked" : "Not linked"}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">First Name</Label>
                    <Input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last Name</Label>
                    <Input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Roles</CardTitle>
              {!editingRoles ? (
                <Button variant="ghost" size="sm" onClick={startEditRoles} className="gap-1">
                  <IconEdit className="h-4 w-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRoles(false)}>
                    <IconX className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={saveRoles} disabled={saving}>
                    {saving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editingRoles ? (
              <div className="flex flex-wrap gap-1.5">
                {user.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No roles assigned</span>
                ) : (
                  user.roles.map((r) => {
                    const opt = ROLE_OPTIONS.find((o) => o.id === r);
                    return (
                      <Badge key={r} variant={r === 0 ? "default" : "outline"}>
                        {opt?.label || `Role ${r}`}
                      </Badge>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {ROLE_OPTIONS.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${opt.id}`}
                      checked={draftRoles.includes(opt.id)}
                      onCheckedChange={() => toggleRole(opt.id)}
                    />
                    <label htmlFor={`role-${opt.id}`} className="text-sm cursor-pointer">
                      {opt.label}
                      <span className="ml-1 text-xs text-muted-foreground">(id={opt.id})</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconLock className="h-4 w-4" />
              Permissions
              <Badge variant="secondary">{user.permissions.length}</Badge>
            </CardTitle>
            {!editingPerms ? (
              <Button variant="ghost" size="sm" onClick={startEditPerms} className="gap-1">
                <IconEdit className="h-4 w-4" /> Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingPerms(false)}>
                  <IconX className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={savePerms} disabled={saving}>
                  {saving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!editingPerms ? (
            <div className="flex flex-wrap gap-1">
              {user.permissions.length === 0 ? (
                <span className="text-xs text-muted-foreground">No individual permissions</span>
              ) : (
                user.permissions.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {allPerms ? (
                Object.entries(allPerms.categories).map(([cat, perms]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {perms.filter((p) => !p.hidden).map((p) => (
                        <div key={p.name} className="flex items-start gap-2">
                          <Checkbox
                            id={`perm-${p.name}`}
                            checked={draftPerms.includes(p.name)}
                            onCheckedChange={() => togglePerm(p.name)}
                            className="mt-0.5"
                          />
                          <label htmlFor={`perm-${p.name}`} className="text-xs cursor-pointer">
                            <span className="font-medium">{p.label || p.name}</span>
                            {p.description && (
                              <span className="block text-muted-foreground">{p.description}</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Loading permissions...</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBriefcase className="h-4 w-4" /> Jobs Created ({user.jobsCreated})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentJobs.length > 0 ? (
              <div className="space-y-1">
                {user.recentJobs.map((j) => (
                  <div key={j.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{j.name || `Job #${j.id}`}</span>
                    <Badge variant="outline" className="text-xs">{j.pipeline}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No jobs created.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconMapPin className="h-4 w-4" /> Sites Created ({user.sitesCreated})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentSites.length > 0 ? (
              <div className="space-y-1">
                {user.recentSites.map((s) => (
                  <div key={s.id} className="rounded border p-2 text-sm">{s.name}</div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sites created.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPwdDialog} onOpenChange={setShowPwdDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconKey className="h-5 w-5" /> Change Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{user.email}</strong>. All sessions will be terminated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPwdDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={saving || !newPassword || newPassword !== pwdConfirm}>
              {saving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
