"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconBuilding, IconSearch, IconBriefcase, IconUsers, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";

interface OrgData {
  id: number;
  name: string;
  address: string | null;
  logo: string | null;
  contactCount: number;
  jobCount: number;
}

async function fetchOrganizations() {
  const res = await fetch("/api/organizations");
  if (!res.ok) throw new Error("Failed to fetch organizations");
  const json = await res.json();
  return json.data as { organizations: OrgData[]; total: number };
}

export default function ManageCompanyPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["organizations"], queryFn: fetchOrganizations });

  const filtered = data?.organizations.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.address && o.address.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Companies</h2>
          <p className="text-muted-foreground">{data?.total || 0} companies in the system.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => (
            <Link key={org.id} href={`/hub/onboard/company/manage/${org.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/40">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <IconBuilding className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">{org.name}</h3>
                    </div>
                    <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {org.address && (
                    <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{org.address}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      <IconBriefcase className="mr-1 h-3 w-3" />
                      {org.jobCount} jobs
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <IconUsers className="mr-1 h-3 w-3" />
                      {org.contactCount} contacts
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">No companies found.</p>
          )}
        </div>
      )}
    </div>
  );
}
