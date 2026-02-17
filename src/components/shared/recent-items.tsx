"use client";

import Link from "next/link";
import { useRecentItems } from "@/lib/hooks/use-recent-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  IconBriefcase,
  IconMapPin,
  IconBuilding,
  IconUser,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface RecentItemsProps {
  collapsed?: boolean;
}

export function RecentItems({ collapsed }: RecentItemsProps) {
  const { recentItems, removeRecentItem, clearRecentItems } = useRecentItems();

  if (recentItems.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "job":
        return <IconBriefcase className="h-4 w-4" />;
      case "site":
        return <IconMapPin className="h-4 w-4" />;
      case "organization":
        return <IconBuilding className="h-4 w-4" />;
      case "user":
        return <IconUser className="h-4 w-4" />;
      default:
        return <IconClock className="h-4 w-4" />;
    }
  };

  if (collapsed) {
    // Collapsed view - just show icon
    return null; // Don't show in collapsed mode
  }

  return (
    <div className="px-3 py-2">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <IconClock className="h-3.5 w-3.5" />
          <span>Recent</span>
        </div>
        {recentItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentItems}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[200px]">
        <div className="space-y-1">
          {recentItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Link href={item.url} className="flex flex-1 items-center gap-2">
                <span className="text-muted-foreground">{getIcon(item.type)}</span>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => removeRecentItem(item.id, item.type)}
              >
                <IconX className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
