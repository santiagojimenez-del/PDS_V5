"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconBookmark,
  IconLayersSubtract,
  IconPlus,
  IconTrash,
  IconFocus2,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import type { SavedView } from "../../types";

interface ControlPanelProps {
  // Views props
  views: SavedView[];
  onSaveView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onGoToView: (view: SavedView) => void;
  getCurrentView: () => { center: [number, number]; zoom: number } | null;

  // Layers props
  showTileset: boolean;
  onToggleTileset: () => void;
}

type TabType = "views" | "layers";

export function ControlPanel({
  views,
  onSaveView,
  onDeleteView,
  onGoToView,
  getCurrentView,
  showTileset,
  onToggleTileset,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("views");
  const [newViewName, setNewViewName] = useState("");

  const handleSaveView = () => {
    const name = newViewName.trim();
    if (!name) return;

    const current = getCurrentView();
    if (!current) return;

    onSaveView({
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      center: current.center,
      zoom: current.zoom,
    });
    setNewViewName("");
  };

  // Collapsed state
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-14 left-0 z-[1000] bg-background/90 backdrop-blur-sm border-r border-b rounded-br-lg px-3 py-2 hover:bg-accent transition-colors"
        title="Open controls"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute top-12 left-0 bottom-0 z-[1000] w-72 bg-background/95 backdrop-blur-sm border-r flex flex-col">
      {/* Header with tabs */}
      <div className="border-b">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Controls</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            title="Collapse panel"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-t">
          <button
            onClick={() => setActiveTab("views")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "views"
                ? "border-primary text-primary bg-accent/50"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <IconBookmark className="h-3.5 w-3.5" />
            Views ({views.length})
          </button>
          <button
            onClick={() => setActiveTab("layers")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === "layers"
                ? "border-primary text-primary bg-accent/50"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <IconLayersSubtract className="h-3.5 w-3.5" />
            Layers
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "views" && (
          <div className="p-3 space-y-2">
            {views.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No saved views yet. Save the current camera position below.
              </p>
            ) : (
              <div className="space-y-1">
                {views.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 text-sm"
                  >
                    <button
                      onClick={() => onGoToView(view)}
                      className="flex-1 flex items-center gap-2 text-left truncate hover:text-primary"
                      title={`Go to "${view.name}"`}
                    >
                      <IconFocus2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{view.name}</span>
                    </button>
                    <button
                      onClick={() => onDeleteView(view.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      title="Delete view"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "layers" && (
          <div className="p-3">
            <label className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={showTileset}
                onChange={onToggleTileset}
                className="rounded border-muted-foreground"
              />
              <IconLayersSubtract className="h-4 w-4" />
              <span>Aerial Tileset</span>
            </label>
            <p className="text-xs text-muted-foreground mt-3 px-2">
              Toggle the aerial imagery overlay on/off.
            </p>
          </div>
        )}
      </div>

      {/* Footer - only show in Views tab */}
      {activeTab === "views" && (
        <div className="p-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveView();
            }}
            className="space-y-2"
          >
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="h-8 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full h-8"
              disabled={!newViewName.trim()}
            >
              <IconPlus className="h-3.5 w-3.5 mr-1.5" />
              Save Current View
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
