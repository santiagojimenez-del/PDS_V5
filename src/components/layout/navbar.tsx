"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  IconLogout,
  IconSettings,
  IconMenu2,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconChevronRight,
} from "@tabler/icons-react";
import { useTheme } from "@/components/providers/theme-provider";
import { GlobalSearch } from "@/components/shared/global-search";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LanguageSelector } from "@/components/shared/language-selector";
import { useTranslation } from "@/lib/i18n/locale-provider";
import type { AuthUser } from "@/modules/auth/types";

interface NavbarProps {
  user: AuthUser;
  siteTitle: string;
  onMobileMenuToggle: () => void;
}


export function Navbar({ user, siteTitle, onMobileMenuToggle }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  // Build breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: t(`nav.${seg}`) !== `nav.${seg}` ? t(`nav.${seg}`) : seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="h-8 w-8 lg:hidden"
          aria-label="Toggle mobile menu"
        >
          <IconMenu2 className="h-5 w-5" aria-hidden="true" />
        </Button>

        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm sm:flex">
          <ol className="flex items-center gap-1 list-none">
            {breadcrumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {crumb.isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">{crumb.label}</span>
                ) : (
                  <>
                    <span className="text-muted-foreground">{crumb.label}</span>
                    <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
                  </>
                )}
              </li>
            ))}
            {breadcrumbs.length === 0 && (
              <li><span className="font-medium text-foreground" aria-current="page">{t("nav.dashboard")}</span></li>
            )}
          </ol>
        </nav>

        {/* Mobile: just show current page name */}
        <span className="text-sm font-medium sm:hidden">
          {breadcrumbs[breadcrumbs.length - 1]?.label || t("nav.dashboard")}
        </span>
      </div>

      {/* Center: Global Search */}
      <div className="hidden flex-1 items-center justify-center px-4 md:flex">
        <GlobalSearch />
      </div>

      {/* Right: notifications + language + theme toggle + user menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notifications */}
        <NotificationBell />

        {/* Language selector */}
        <LanguageSelector />

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Switch theme (current: ${theme})`}
            >
              {theme === "dark" ? (
                <IconMoon className="h-4 w-4" aria-hidden="true" />
              ) : theme === "system" ? (
                <IconDeviceDesktop className="h-4 w-4" aria-hidden="true" />
              ) : (
                <IconSun className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <IconSun className="mr-2 h-4 w-4" aria-hidden="true" /> {t("theme.light")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <IconMoon className="mr-2 h-4 w-4" aria-hidden="true" /> {t("theme.dark")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <IconDeviceDesktop className="mr-2 h-4 w-4" aria-hidden="true" /> {t("theme.system")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              aria-label={`User menu for ${user.fullName || user.email}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <IconSettings className="mr-2 h-4 w-4" />
              {t("user.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <IconLogout className="mr-2 h-4 w-4" />
              {t("user.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
