"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPlus, IconTrash, IconPalette } from "@tabler/icons-react";
import type { ClassificationItem } from "../../types";

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface ClassificationSidebarProps {
  classifications: ClassificationItem[];
  selectedClassificationId?: string | null;
  onAdd: (item: ClassificationItem) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string | null) => void;
  onColorChange: (id: string, color: string) => void;
}

export function ClassificationSidebar({
  classifications,
  selectedClassificationId,
  onAdd,
  onRemove,
  onSelect,
  onColorChange,
}: ClassificationSidebarProps) {
  const [newName, setNewName] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;

    const colorIndex = classifications.length % DEFAULT_COLORS.length;
    const item: ClassificationItem = {
      id: `cls-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      color: DEFAULT_COLORS[colorIndex],
    };
    onAdd(item);
    setNewName("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-14 right-0 z-[1000] bg-background/90 backdrop-blur-sm border-l border-b rounded-bl-lg px-3 py-2 text-xs font-medium hover:bg-accent"
      >
        <IconPalette className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute top-12 right-0 bottom-0 z-[1000] w-64 bg-background/95 backdrop-blur-sm border-l flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-semibold">Classifications</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Hide
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {classifications.length === 0 && (
          <p className="text-xs text-muted-foreground p-2">
            No classifications yet. Add one below.
          </p>
        )}

        {classifications.map((cls) => (
          <div
            key={cls.id}
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${
              selectedClassificationId === cls.id
                ? "bg-accent"
                : "hover:bg-accent/50"
            }`}
            onClick={() => onSelect(selectedClassificationId === cls.id ? null : cls.id)}
          >
            <input
              type="color"
              value={cls.color}
              onChange={(e) => onColorChange(cls.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded border cursor-pointer p-0"
            />
            <span className="flex-1 truncate">{cls.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(cls.id);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex gap-2"
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Class name..."
            className="h-8 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            disabled={!newName.trim()}
          >
            <IconPlus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
