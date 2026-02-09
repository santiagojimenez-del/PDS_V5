"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconLayersLinked, IconSearch, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";

interface TilesetData {
  id: number;
  name: string;
  description: string | null;
  path: string;
  published: boolean;
  preset: string | null;
  createdBy: string | null;
}

async function fetchTilesets() {
  const res = await fetch("/api/tilesets");
  if (!res.ok) throw new Error("Failed to fetch tilesets");
  const json = await res.json();
  return json.data as { tilesets: TilesetData[]; total: number };
}

export default function TilesetsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["tilesets"], queryFn: fetchTilesets });

  const filtered = data?.tilesets.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tilesets</h2>
          <p className="text-muted-foreground">{data?.total || 0} tilesets available.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tilesets..."
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
          {filtered.map((tileset) => (
            <Card key={tileset.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconLayersLinked className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">{tileset.name}</h3>
                  </div>
                  <Badge variant={tileset.published ? "default" : "secondary"} className="text-xs">
                    {tileset.published ? (
                      <><IconEye className="mr-1 h-3 w-3" />Published</>
                    ) : (
                      <><IconEyeOff className="mr-1 h-3 w-3" />Draft</>
                    )}
                  </Badge>
                </div>
                {tileset.description && (
                  <p className="mb-1 text-xs text-muted-foreground line-clamp-2">{tileset.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {tileset.preset && <span>Preset: {tileset.preset}</span>}
                  {tileset.createdBy && <span>By {tileset.createdBy}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">No tilesets found.</p>
          )}
        </div>
      )}
    </div>
  );
}
