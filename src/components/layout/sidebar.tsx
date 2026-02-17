"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LOGOS } from "@/lib/constants/assets";
import { RecentItems } from "@/components/shared/recent-items";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconChevronDown,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconX,
} from "@tabler/icons-react";
import type { NavGroup } from "@/modules/permissions/types";
import type { AuthUser } from "@/modules/auth/types";

interface SidebarProps {
  navigation: NavGroup[];
  siteTitle: string;
  siteLogo: string;
  app: string;
  user: AuthUser;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  navigation,
  siteTitle,
  siteLogo,
  app,
  user,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navigation.map((g) => g.name))
  );

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const getHref = (page: string) => {
    if (!page || page === "/") return `/${app}`;
    // If page already starts with /, use as is (absolute path)
    if (page.startsWith("/")) return page;
    // Otherwise, prepend the app prefix
    return `/${app}/${page}`;
  };

  const isActive = (page: string) => {
    const href = getHref(page);
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/" className="flex items-center justify-center" onClick={onMobileClose}>
          {collapsed ? (
            <Image
              src={LOGOS.SMALL_ALT}
              alt="PDS"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          ) : (
            <Image
              src={LOGOS.LARGE_DARK}
              alt="Professional Drone Solutions"
              width={140}
              height={48}
              className="h-10 w-auto"
              priority
            />
          )}
        </Link>
        {/* Collapse toggle - desktop only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
        >
          {collapsed ? <IconChevronsRight className="h-4 w-4" /> : <IconChevronsLeft className="h-4 w-4" />}
        </Button>
        {/* Close button - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn("space-y-0.5", collapsed ? "px-1.5" : "px-2.5")}>
          {navigation.map((group) => (
            <div key={group.name} className="mb-2">
              {/* Group header */}
              {group.items.length > 1 && !collapsed && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/60"
                >
                  <span>{group.dropdown?.title || group.name}</span>
                  {expandedGroups.has(group.name) ? (
                    <IconChevronDown className="h-3 w-3" />
                  ) : (
                    <IconChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}

              {/* Group items */}
              {(expandedGroups.has(group.name) || group.items.length === 1) &&
                group.items.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.pageId}
                      href={getHref(item.page)}
                      onClick={onMobileClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <span
                        className={cn(
                          "sidebar-icon flex h-5 w-5 shrink-0 items-center justify-center",
                          active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                        )}
                        dangerouslySetInnerHTML={{ __html: item.icon }}
                      />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Recent Items */}
      {!collapsed && (
        <>
          <Separator className="bg-sidebar-border" />
          <RecentItems collapsed={collapsed} />
        </>
      )}

      {/* User footer */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="flex items-center justify-center" title={user.fullName || user.email}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {(user.firstName?.[0] || user.email[0]).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-screen flex-col bg-sidebar transition-all duration-200 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
