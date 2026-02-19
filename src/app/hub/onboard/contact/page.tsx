"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IconUserPlus, IconLoader2, IconCheck } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";

interface OrgOption {
  id: number;
  name: string;
}

const EMPTY_ORG = "__none__";

export default function OnboardContactPage() {
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", phone: "", orgId: EMPTY_ORG,
  });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState("");

  // Fetch organizations for selector
  const { data: orgsData } = useQuery<{ organizations: OrgOption[] }>({
    queryKey: ["organizations-list"],
    queryFn: async () => {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed");
      return res.json().then((j) => j.data);
    },
  });

  const orgs = orgsData?.organizations || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.firstName.trim()) return;

    setSubmitting(true);
    setError("");
    setCreated(null);

    try {
      const body: Record<string, string | number | undefined> = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      if (form.orgId !== EMPTY_ORG) {
        body.orgId = parseInt(form.orgId, 10);
      }

      const res = await fetch("/api/onboard/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create contact");

      const name = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      setCreated({ id: json.data.id, name });
      setForm({ email: "", firstName: "", lastName: "", phone: "", orgId: EMPTY_ORG });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Onboard Contact</h2>
        <p className="text-muted-foreground">
          Creates a Client account and sends a welcome email so the contact can set their password.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUserPlus className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {created ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <IconCheck className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-sm text-green-800 dark:text-green-300">
                    Contact <strong>{created.name}</strong> created (ID {created.id})
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    A welcome email has been sent with instructions to set their password.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setCreated(null)} variant="outline" className="flex-1">
                  Add Another
                </Button>
                <Link href="/hub/onboard/contact/manage" className="flex-1">
                  <Button variant="secondary" className="w-full">View All Contacts</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First Name *</Label>
                  <Input
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Last Name</Label>
                  <Input
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Organization (optional)</Label>
                <Select
                  value={form.orgId}
                  onValueChange={(v) => setForm((p) => ({ ...p, orgId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_ORG}>— No organization —</SelectItem>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !form.email.trim() || !form.firstName.trim()}
              >
                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Creating…" : "Create Contact & Send Email"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
