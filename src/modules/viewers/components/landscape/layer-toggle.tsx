"use client";

import { IconLayersSubtract } from "@tabler/icons-react";
import { useState } from "react";

interface LayerState {
  tileset: boolean;
  parcels: boolean;
  roads: boolean;
  areas: boolean;
}

interface LayerToggleProps {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
}

const LAYER_LABELS: Record<keyof LayerState, string> = {
  tileset: "Aerial Tileset",
  parcels: "Parcels",
  roads: "Roads",
  areas: "Areas",
};

export function LayerToggle({ layers, onToggle }: LayerToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
      >
        <IconLayersSubtract className="h-4 w-4" />
        Layers
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-48 p-2">
          {(Object.keys(layers) as Array<keyof LayerState>).map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => onToggle(key)}
                className="rounded border-muted-foreground"
              />
              {LAYER_LABELS[key]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
