"use client";

import { IconLayersSubtract } from "@tabler/icons-react";

interface LayerToggleProps {
  showTileset: boolean;
  onToggleTileset: () => void;
}

export function LayerToggle({ showTileset, onToggleTileset }: LayerToggleProps) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000]">
      <label className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors cursor-pointer">
        <input
          type="checkbox"
          checked={showTileset}
          onChange={onToggleTileset}
          className="rounded border-muted-foreground"
        />
        <IconLayersSubtract className="h-4 w-4" />
        <span>Aerial Tileset</span>
      </label>
    </div>
  );
}
