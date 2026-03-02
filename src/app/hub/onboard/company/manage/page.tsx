"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconBuilding, IconSearch, IconBriefcase, IconUsers } from "@tabler/icons-react";
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Contacts</TableHead>
              <TableHead className="text-right">Jobs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org) => (
                <TableRow key={org.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/hub/onboard/company/manage/${org.id}`} className="flex items-center gap-2 hover:underline">
                      <IconBuilding className="h-4 w-4 shrink-0 text-primary" />
                      <span className="font-medium">{org.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.address || <span className="text-muted-foreground/50">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">
                      <IconUsers className="mr-1 h-3 w-3" />
                      {org.contactCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">
                      <IconBriefcase className="mr-1 h-3 w-3" />
                      {org.jobCount}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
