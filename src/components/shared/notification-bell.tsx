"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  IconBell,
  IconBellOff,
  IconBriefcase,
  IconFileInvoice,
  IconCircleCheck,
  IconCalendar,
  IconPackage,
  IconCash,
  IconInfoCircle,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: number;
  createdAt: string;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  job_created: IconBriefcase,
  job_approved: IconCircleCheck,
  job_scheduled: IconCalendar,
  job_flight_logged: IconCalendar,
  job_delivered: IconPackage,
  job_billed: IconFileInvoice,
  job_completed: IconCircleCheck,
  invoice_created: IconFileInvoice,
  invoice_paid: IconCash,
  general: IconInfoCircle,
};

const TYPE_COLORS: Record<string, string> = {
  job_created: "text-blue-500",
  job_approved: "text-green-500",
  job_scheduled: "text-blue-500",
  job_flight_logged: "text-purple-500",
  job_delivered: "text-orange-500",
  job_billed: "text-yellow-500",
  job_completed: "text-green-600",
  invoice_created: "text-blue-500",
  invoice_paid: "text-green-500",
  general: "text-muted-foreground",
};

async function fetchNotifications(): Promise<NotificationsData> {
  const res = await fetch("/api/notifications?limit=20");
  if (!res.ok) return { notifications: [], unreadCount: 0 };
  const json = await res.json();
  return json.data;
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000, // poll every 30s
    refetchIntervalInBackground: false,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    // When opening, mark all as read after a short delay
    if (isOpen && unreadCount > 0) {
      setTimeout(() => markAllRead.mutate(), 1500);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <IconBell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <Separator />

        {/* List */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <IconBellOff className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y">
              {items.map((item) => {
                const Icon = TYPE_ICONS[item.type] || IconInfoCircle;
                const iconColor = TYPE_COLORS[item.type] || "text-muted-foreground";
                const isUnread = item.isRead === 0;

                const inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (isUnread) markOneRead.mutate(item.id);
                    }}
                  >
                    <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            isUnread ? "font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {item.message && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {item.message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );

                return item.link ? (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={item.id}>{inner}</div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
