"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  IconSearch, IconUser, IconMail, IconPhone, IconShieldCheck, IconPlus, IconLoader2,
} from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

const ROLE_NAMES: Record<number, string> = {
  0: "Admin", 1: "Client", 3: "Registered", 4: "Developer",
  5: "Staff", 6: "Pilot", 7: "Manager",
};

interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: number[];
  phoneNumber: string | null;
  twoFactorEnabled: boolean;
}

async function fetchUsers() {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  return json.data as { users: UserData[]; total: number };
}

// ── Create User Dialog ────────────────────────────────────────────────────────

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: "", password: "", firstName: "", lastName: "", phoneNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!form.email || !form.password) { toast.error("Email and password are required"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roles: [3] }), // default Registered role
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to create user"); return; }
      toast.success(`User ${form.email} created`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setForm({ email: "", password: "", firstName: "", lastName: "", phoneNumber: "" });
      onClose();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPlus className="h-5 w-5" /> Create User
          </DialogTitle>
          <DialogDescription>
            Creates a new user with the Registered role. You can edit roles and permissions after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Password * (min. 8 chars)</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input
                placeholder="John"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input
              placeholder="+1 555 000 0000"
              value={form.phoneNumber}
              onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleCreate} disabled={submitting || !form.email || !form.password}>
            {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserSearchPage() {
  const [search,      setSearch]      = useState("");
  const [showCreate,  setShowCreate]  = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });

  const filtered = data?.users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(search))
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Search</h2>
          <p className="text-muted-foreground">{data?.total || 0} users in the system.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <IconPlus className="h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <IconUser className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{u.fullName || u.email}</span>
                        {u.twoFactorEnabled && (
                          <IconShieldCheck className="h-3.5 w-3.5 text-green-500" title="2FA Enabled" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconMail className="h-3 w-3" /> {u.email}
                        </span>
                        {u.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <IconPhone className="h-3 w-3" /> {u.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {u.roles.map((r) => (
                      <Badge key={r} variant={r === 0 ? "default" : "outline"} className="text-xs">
                        {ROLE_NAMES[r] || `Role ${r}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No users found.</p>
          )}
        </div>
      )}

      <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
