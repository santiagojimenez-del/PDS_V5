"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconLayersLinked, IconSearch, IconEye, IconEyeOff, IconPlus,
  IconEdit, IconTrash, IconLoader2,
} from "@tabler/icons-react";
import { useState } from "react";
import { UploadDialog } from "@/modules/upload/components/upload-dialog";
import { toast } from "sonner";

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

// ── Edit Dialog ───────────────────────────────────────────────────────────────

function EditTilesetDialog({
  tileset,
  onClose,
}: {
  tileset: TilesetData;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: tileset.name,
    description: tileset.description || "",
    preset: tileset.preset || "",
    published: tileset.published,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tilesets/${tileset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          preset: form.preset || null,
          published: form.published,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to update"); return; }
      toast.success("Tileset updated");
      qc.invalidateQueries({ queryKey: ["tilesets"] });
      onClose();
    } catch {
      toast.error("Failed to update tileset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconEdit className="h-5 w-5" /> Edit Tileset
          </DialogTitle>
          <DialogDescription>Update the tileset name, description, and settings.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Tileset name"
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-1">
            <Label>Preset</Label>
            <select
              value={form.preset}
              onChange={(e) => setForm((p) => ({ ...p, preset: e.target.value }))}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
            >
              <option value="">No preset</option>
              <option value="landscape">Landscape</option>
              <option value="community">Community</option>
              <option value="construct">Construct</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
              className="h-4 w-4 rounded border"
            />
            <Label htmlFor="published">Published (visible in viewers)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TilesetsPage() {
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTileset, setEditTileset] = useState<TilesetData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TilesetData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tilesets"], queryFn: fetchTilesets });

  const handleUploadComplete = async (uploadData: any) => {
    try {
      const res = await fetch("/api/tilesets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadData.fileName.replace(/\.[^/.]+$/, ""),
          path: uploadData.finalPath,
          description: `Uploaded on ${new Date().toLocaleString()}`,
        }),
      });
      if (res.ok) {
        toast.success("Tileset registered successfully");
        qc.invalidateQueries({ queryKey: ["tilesets"] });
        setUploadOpen(false);
      } else {
        toast.error("Failed to register tileset");
      }
    } catch {
      toast.error("An error occurred while registering the tileset");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tilesets/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to delete"); return; }
      toast.success("Tileset deleted");
      qc.invalidateQueries({ queryKey: ["tilesets"] });
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete tileset");
    } finally {
      setDeleting(false);
    }
  };

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
        <Button onClick={() => setUploadOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Tileset
        </Button>
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
        title="Upload New Tileset"
        description="Select a .mbtiles or .tif file to upload. It will be stored securely."
      />

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
            <Card key={tileset.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconLayersLinked className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-sm truncate">{tileset.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => setEditTileset(tileset)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <IconEdit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(tileset)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
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

      {/* Edit Dialog */}
      {editTileset && (
        <EditTilesetDialog
          tileset={editTileset}
          onClose={() => setEditTileset(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tileset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> from the database.
              The tile files on disk will not be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
