"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconSearch, IconUser, IconMail, IconPhone, IconShieldCheck } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";

const ROLE_NAMES: Record<number, string> = {
  0: "Admin",
  1: "Client",
  3: "Registered",
  4: "Developer",
  5: "Staff",
  6: "Pilot",
  7: "Manager",
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

export default function UserSearchPage() {
  const [search, setSearch] = useState("");
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
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
                  <div className="flex gap-1">
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
    </div>
  );
}
