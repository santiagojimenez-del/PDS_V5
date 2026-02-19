"use client";

import { useState } from "react";
import { useCurrentUser } from "@/modules/permissions/hooks/use-permissions";
import { useQueryClient } from "@tanstack/react-query";
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
  IconSun, IconUser, IconLock, IconBell,
  IconShieldCheck, IconShieldOff, IconLoader2,
} from "@tabler/icons-react";

export default function SettingsPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const qc = useQueryClient();
  const user = userData?.data?.user;

  const [toggling2FA, setToggling2FA] = useState(false);

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
          <CardDescription>Your account details and information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={user?.organizationName || "N/A"} disabled />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            To update your profile information, please contact your administrator.
          </p>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your jobs and projects
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enabled
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Job Status Updates</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when job status changes
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enabled
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to modify notification preferences.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
