"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

export default function ManageTilesetPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [preset, setPreset] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tilesets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          path: path.trim(),
          preset: preset.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create tileset");
      }
      setMessage({ type: "success", text: `Tileset "${name}" created successfully.` });
      setName("");
      setDescription("");
      setPath("");
      setPreset("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create Tileset</h2>
        <p className="text-muted-foreground">Configure and create a new tileset.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
            Tileset Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tileset Name *</label>
              <Input
                placeholder="Enter tileset name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Input
                placeholder="Enter description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tile Path *</label>
              <Input
                placeholder="/tiles/my-tileset/{z}/{x}/{y}.png"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preset</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
              >
                <option value="">No preset</option>
                <option value="landscape">Landscape</option>
                <option value="community">Community</option>
                <option value="construct">Construct</option>
              </select>
            </div>
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={submitting || !name.trim() || !path.trim()}>
              {submitting ? "Creating..." : "Create Tileset"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
