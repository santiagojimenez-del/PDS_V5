"use client";

import { useState } from "react";
import { useCurrentUser } from "@/modules/permissions/hooks/use-permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  IconSun, IconUser, IconLock, IconBell, IconBellOff,
  IconShieldCheck, IconShieldOff, IconLoader2, IconDeviceFloppy,
} from "@tabler/icons-react";

const ROLE_LABELS: Record<number, string> = {
  0: "Admin", 1: "Client", 3: "Registered",
  4: "Developer", 5: "Staff", 6: "Pilot", 7: "Manager",
};

export default function SettingsPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const qc = useQueryClient();
  const user = userData?.data?.user;

  const [toggling2FA,   setToggling2FA]   = useState(false);
  const [togglingNotif, setTogglingNotif] = useState<string | null>(null);

  // ── Editable profile ───────────────────────────────────────────────────────
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/profile");
      if (!res.ok) return null;
      return (await res.json()).data as { firstName: string; lastName: string; phoneNumber: string };
    },
    staleTime: 60_000,
  });

  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phoneNumber: "" });
  const [profileReady, setProfileReady] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync form when data loads (only once)
  if (profileData && !profileReady) {
    setProfileForm({
      firstName:   profileData.firstName,
      lastName:    profileData.lastName,
      phoneNumber: profileData.phoneNumber,
    });
    setProfileReady(true);
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to save"); return; }
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["currentUser"] });
      qc.invalidateQueries({ queryKey: ["myProfile"] });
      setProfileReady(false); // allow re-sync on next load
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Notification preferences ───────────────────────────────────────────────
  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ["notificationPrefs"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/notifications");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data.preferences as Record<string, boolean>;
    },
    staleTime: 60_000,
  });

  const handleNotifToggle = async (key: string, current: boolean) => {
    setTogglingNotif(key);
    try {
      const res = await fetch("/api/users/me/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: !current }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to update"); return; }
      toast.success(`Notification ${!current ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["notificationPrefs"] });
    } catch {
      toast.error("Failed to update notification preference");
    } finally {
      setTogglingNotif(null);
    }
  };

  const handle2FAToggle = async (enable: boolean) => {
    setToggling2FA(true);
    try {
      const res = await fetch("/api/users/me/2fa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: enable ? "enable" : "disable" }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to update 2FA"); return; }
      toast.success(json.data.message);
      qc.invalidateQueries({ queryKey: ["currentUser"] });
    } catch {
      toast.error("Failed to update 2FA settings");
    } finally {
      setToggling2FA(false);
    }
  };

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to update password");
        return;
      }

      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconUser className="h-5 w-5 text-primary" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your name and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Read-only: email + roles */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Roles</Label>
                  <div className="flex flex-wrap gap-1 rounded-md border px-3 py-2 min-h-9">
                    {(user?.roles ?? []).map((r: number) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {ROLE_LABELS[r] ?? `Role ${r}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Editable: name + phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <Button type="submit" disabled={savingProfile}>
                {savingProfile
                  ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                  : <><IconDeviceFloppy className="mr-2 h-4 w-4" />Save Profile</>}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconSun className="h-5 w-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how ProDrones Hub looks for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <ThemeToggle variant="buttons" />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconLock className="h-5 w-5 text-primary" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your password and security preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="Enter current password"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Adds an extra layer of security by requiring an email code at each login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Email 2FA</span>
                {user?.twoFactorRequired ? (
                  <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                    <IconShieldCheck className="h-3 w-3" /> Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <IconShieldOff className="h-3 w-3" /> Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.twoFactorRequired
                  ? "A verification code will be sent to your email on each login."
                  : "Enable to receive a code by email each time you log in."}
              </p>
            </div>
            {user?.twoFactorRequired ? (
              <Button
                variant="outline"
                className="shrink-0 gap-2 text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => handle2FAToggle(false)}
                disabled={toggling2FA}
              >
                {toggling2FA
                  ? <IconLoader2 className="h-4 w-4 animate-spin" />
                  : <IconShieldOff className="h-4 w-4" />}
                Disable 2FA
              </Button>
            ) : (
              <Button
                className="shrink-0 gap-2"
                onClick={() => handle2FAToggle(true)}
                disabled={toggling2FA}
              >
                {toggling2FA
                  ? <IconLoader2 className="h-4 w-4 animate-spin" />
                  : <IconShieldCheck className="h-4 w-4" />}
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {notifLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email Notifications</span>
                    {notifData?.notify_email !== false ? (
                      <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                        <IconBell className="h-3 w-3" /> Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <IconBellOff className="h-3 w-3" /> Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your jobs and projects
                  </p>
                </div>
                {notifData?.notify_email !== false ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2 text-destructive border-destructive hover:bg-destructive/10"
                    disabled={togglingNotif === "notify_email"}
                    onClick={() => handleNotifToggle("notify_email", true)}
                  >
                    {togglingNotif === "notify_email"
                      ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                      : <IconBellOff className="h-3.5 w-3.5" />}
                    Disable
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0 gap-2"
                    disabled={togglingNotif === "notify_email"}
                    onClick={() => handleNotifToggle("notify_email", false)}
                  >
                    {togglingNotif === "notify_email"
                      ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                      : <IconBell className="h-3.5 w-3.5" />}
                    Enable
                  </Button>
                )}
              </div>

              <Separator />

              {/* Job Status Updates */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Job Status Updates</span>
                    {notifData?.notify_job_status !== false ? (
                      <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                        <IconBell className="h-3 w-3" /> Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <IconBellOff className="h-3 w-3" /> Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a job moves to a new pipeline stage
                  </p>
                </div>
                {notifData?.notify_job_status !== false ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2 text-destructive border-destructive hover:bg-destructive/10"
                    disabled={togglingNotif === "notify_job_status"}
                    onClick={() => handleNotifToggle("notify_job_status", true)}
                  >
                    {togglingNotif === "notify_job_status"
                      ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                      : <IconBellOff className="h-3.5 w-3.5" />}
                    Disable
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0 gap-2"
                    disabled={togglingNotif === "notify_job_status"}
                    onClick={() => handleNotifToggle("notify_job_status", false)}
                  >
                    {togglingNotif === "notify_job_status"
                      ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                      : <IconBell className="h-3.5 w-3.5" />}
                    Enable
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
