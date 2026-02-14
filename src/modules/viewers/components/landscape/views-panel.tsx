"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconBookmark,
  IconPlus,
  IconTrash,
  IconFocus2,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import type { SavedView } from "../../types";

interface ViewsPanelProps {
  views: SavedView[];
  onSaveView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onGoToView: (view: SavedView) => void;
  getCurrentView: () => { center: [number, number]; zoom: number } | null;
}

export function ViewsPanel({
  views,
  onSaveView,
  onDeleteView,
  onGoToView,
  getCurrentView,
}: ViewsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  const handleSave = () => {
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

  return (
    <div className="absolute top-14 left-4 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
      >
        <IconBookmark className="h-4 w-4" />
        Saved Views ({views.length})
        {isOpen ? (
          <IconChevronUp className="h-3.5 w-3.5" />
        ) : (
          <IconChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg w-64">
          <div className="max-h-48 overflow-y-auto">
            {views.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">
                No saved views. Save the current camera position below.
              </p>
            )}
            {views.map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 text-sm border-b last:border-b-0"
              >
                <button
                  onClick={() => onGoToView(view)}
                  className="flex-1 text-left truncate hover:text-primary"
                  title={`Go to "${view.name}"`}
                >
                  <IconFocus2 className="h-3.5 w-3.5 inline mr-1.5" />
                  {view.name}
                </button>
                <button
                  onClick={() => onDeleteView(view.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex gap-2 p-2 border-t"
          >
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="h-7 text-xs"
            />
            <Button
              type="submit"
              size="icon"
              variant="outline"
              className="h-7 w-7 shrink-0"
              disabled={!newViewName.trim()}
            >
              <IconPlus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
