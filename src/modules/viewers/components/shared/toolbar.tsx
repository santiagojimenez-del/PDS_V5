"use client";

import {
  IconPencil,
  IconPointer,
  IconDeviceFloppy,
  IconTrash,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ToolbarProps {
  viewerType: string;
  jobName?: string | null;
  isDrawing: boolean;
  hasSelection: boolean;
  isSaving: boolean;
  onDraw: () => void;
  onSelect: () => void;
  onSave: () => void;
  onDelete?: () => void;
  backUrl?: string;
}

export function Toolbar({
  viewerType,
  jobName,
  isDrawing,
  hasSelection,
  isSaving,
  onDraw,
  onSelect,
  onSave,
  onDelete,
  backUrl,
}: ToolbarProps) {
  const router = useRouter();

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center gap-2 bg-background/90 backdrop-blur-sm border-b px-4 py-2">
      {backUrl && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(backUrl)}
          title="Back"
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-center gap-2 mr-4">
        <span className="text-sm font-semibold capitalize">{viewerType} Viewer</span>
        {jobName && (
          <span className="text-xs text-muted-foreground">— {jobName}</span>
        )}
      </div>

      <div className="flex items-center gap-1 border-l pl-3">
        <Button
          variant={isDrawing ? "default" : "outline"}
          size="sm"
          onClick={onDraw}
          title="Draw polygon"
        >
          <IconPencil className="h-4 w-4 mr-1" />
          Draw
        </Button>

        <Button
          variant={!isDrawing ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
          title="Select mode"
        >
          <IconPointer className="h-4 w-4 mr-1" />
          Select
        </Button>

        {hasSelection && onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            title="Delete selected"
          >
            <IconTrash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </div>

      <div className="ml-auto">
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
        >
          <IconDeviceFloppy className="h-4 w-4 mr-1" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
