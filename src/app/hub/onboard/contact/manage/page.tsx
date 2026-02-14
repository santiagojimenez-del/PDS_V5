"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconSearch,
  IconUser,
  IconBuilding,
  IconMail,
  IconPhone,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  orgId: number;
  orgName: string;
}

async function fetchContacts() {
  const res = await fetch("/api/onboard/contacts");
  if (!res.ok) throw new Error("Failed to fetch contacts");
  const json = await res.json();
  return json.data as { contacts: Contact[]; total: number };
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function ManageContactsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orgFilter, setOrgFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["contacts"], queryFn: fetchContacts });

  const orgs = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of data?.contacts || []) {
      map.set(c.orgId, c.orgName);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data?.contacts]);

  const filtered = useMemo(() => {
    let contacts = data?.contacts || [];

    if (orgFilter) {
      contacts = contacts.filter((c) => c.orgId === Number(orgFilter));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.orgName.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    return contacts;
  }, [data?.contacts, search, orgFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const hasFilter = !!orgFilter;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Manage Contacts</h2>
        <p className="text-muted-foreground">{data?.total || 0} contacts registered across all companies.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters || hasFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 gap-1.5",
              hasFilter && !showFilters && "bg-[#ff6600] hover:bg-[#e55c00] text-white"
            )}
          >
            <IconFilter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasFilter && (
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">1</Badge>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          {(search || hasFilter) && " filtered"}
        </p>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Filters</h4>
            {hasFilter && (
              <Button
                variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                onClick={() => { setOrgFilter(""); setPage(0); }}
              >
                <IconX className="mr-1 h-3 w-3" /> Clear
              </Button>
            )}
          </div>
          <div className="max-w-sm space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Company</label>
            <select
              value={orgFilter}
              onChange={(e) => { setOrgFilter(e.target.value); setPage(0); }}
              className="h-9 w-full rounded-md border bg-background px-2.5 text-sm text-foreground"
            >
              <option value="">All companies</option>
              {orgs.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          {hasFilter && (
            <div className="mt-3">
              <Badge variant="secondary" className="gap-1 pr-1">
                Company: {orgs.find(([id]) => id === Number(orgFilter))?.[1]}
                <button onClick={() => { setOrgFilter(""); setPage(0); }} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border py-12 text-center">
          <p className="text-muted-foreground">
            {search || hasFilter ? "No contacts match your filters." : "No contacts found."}
          </p>
          {hasFilter && (
            <Button variant="link" size="sm" onClick={() => { setOrgFilter(""); setPage(0); }} className="mt-2 text-[#ff6600]">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-lg border md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(c.firstName[0] || c.email[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}`.trim() : "—"}
                          </span>
                          <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <IconMail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[220px]">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5">
                          <IconPhone className="h-3.5 w-3.5 shrink-0" />
                          {c.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <IconBuilding className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[180px]">{c.orgName}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {paginated.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(c.firstName[0] || c.email[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}`.trim() : c.email}
                        </span>
                        <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <IconMail className="h-3 w-3" /> {c.email}
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <IconPhone className="h-3 w-3" /> {c.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <IconBuilding className="h-3 w-3" /> {c.orgName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
