"use client";

// Placeholder for future ArcGIS parcel integration
// This will overlay property boundaries from ArcGIS REST services

interface PropertyOverlayProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PropertyOverlay({ enabled, onToggle }: PropertyOverlayProps) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <label className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="rounded border-muted-foreground"
        />
        Property Parcels
        <span className="text-xs text-muted-foreground">(Coming soon)</span>
      </label>
    </div>
  );
}
