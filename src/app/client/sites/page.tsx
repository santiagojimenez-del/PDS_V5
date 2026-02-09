"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconMapPin, IconSearch, IconBriefcase } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";

interface ClientSite {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  jobCount: number;
}

async function fetchClientSites() {
  const res = await fetch("/api/client/sites");
  if (!res.ok) throw new Error("Failed to fetch sites");
  const json = await res.json();
  return json.data as { sites: ClientSite[]; total: number };
}

export default function ClientSitesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["client-sites"], queryFn: fetchClientSites });

  const filtered = data?.sites.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Project Sites</h2>
        <p className="text-muted-foreground">{data?.total || 0} sites associated with your projects.</p>
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
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
          {filtered.map((site) => (
            <Link key={site.id} href={`/client/site/${site.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <IconMapPin className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">{site.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <IconBriefcase className="mr-1 h-3 w-3" />
                      {site.jobCount}
                    </Badge>
                  </div>
                  {site.address && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{site.address}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">No sites found.</p>
          )}
        </div>
      )}
    </div>
  );
}
