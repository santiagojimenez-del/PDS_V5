import { db } from "@/lib/db";
import { permissions as permissionsTable, pages } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { cache } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import { getConfigValue } from "@/modules/config/services/config-loader";
import type { Permission, Role, NavItem, NavGroup } from "../types";
import type { AuthUser } from "@/modules/auth/types";

/**
 * Load all permissions from database
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const cacheKey = "permissions:all";
  const cached = cache.get<Permission[]>(cacheKey);
  if (cached) return cached;

  const rows = await db.select().from(permissionsTable);

  const result: Permission[] = rows.map((row) => ({
    name: row.name,
    category: row.category,
    label: row.label,
    description: row.description,
    priority: row.priority,
    hidden: row.hidden === 1,
    enforce: row.enforce === 1,
    eventWl: row.eventWl ? (typeof row.eventWl === "string" ? JSON.parse(row.eventWl) : row.eventWl) as string[] : null,
    arrayKeyWl: row.arrayKeyWl ? (typeof row.arrayKeyWl === "string" ? JSON.parse(row.arrayKeyWl) : row.arrayKeyWl) as string[] : null,
    htmlIdWl: row.htmlIdWl ? (typeof row.htmlIdWl === "string" ? JSON.parse(row.htmlIdWl) : row.htmlIdWl) as string[] : null,
    jsWhitelist: row.jsWhitelist ? (typeof row.jsWhitelist === "string" ? JSON.parse(row.jsWhitelist) : row.jsWhitelist) as string[] : null,
  }));

  cache.set(cacheKey, result, CACHE_TTL.PERMISSIONS);
  return result;
}

/**
 * Load roles from Configuration table
 */
export async function getAllRoles(): Promise<Role[]> {
  const roles = await getConfigValue<Role[]>("*", "roles");
  return roles || [];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Admins (role 0) have all permissions
  if (user.roles.includes(0)) return true;
  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: AuthUser, roles: number[]): boolean {
  return user.roles.some((r) => roles.includes(r));
}

/**
 * Check if user can access a specific application subdomain
 */
export async function canAccessApp(
  user: AuthUser,
  app: string
): Promise<boolean> {
  const roleAccess = await getConfigValue<number[]>(app, "role_access");
  if (!roleAccess) return true;
  return user.roles.some((r) => roleAccess.includes(r));
}

function parseJson(val: unknown): unknown {
  if (!val) return null;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

/**
 * Map V3 PHP routes to V5 Next.js routes.
 * Pages in the DB use old V3 paths; we translate them to our new routes.
 */
const ROUTE_MAP: Record<string, string> = {
  // Hub
  "/workflow/jobs/": "/workflow/jobs",
  "/workflow/jobs/new.php": "/workflow/jobs/new",
  "/workflow/sites.php": "/workflow/sites",
  "/workflow/recurring/": "/workflow/recurring",
  "/tilesets/": "/tilesets",
  "/tilesets/manage.php": "/tilesets/manage",
  "/onboard/contact/": "/onboard/contact",
  "/onboard/company/": "/onboard/company",
  "/onboard/company/manage.php": "/onboard/company/manage",
  // Admin
  "/user/search.php": "/users/search",
  "/user/roles.php": "/users/roles",
  "/user/view.php": "/users/view",
  "/developer/active-visitors.php": "/developer/active-visitors",
  // Client
  "/site/": "/sites",
  "/site/list.php": "/sites",
  "/job/": "/job",
  "/job/product.php": "/job/product",
  // Auth (global)
  "/login.php": "/login",
  "/register.php": "/register",
  "/forgot-password.php": "/forgot-password",
  "/reset-password.php": "/reset-password",
  "/settings.php": "/settings",
  "/ToS.php": "/tos",
  // Common
  "/": "/",
};

function mapRoute(v3Path: string): string {
  return ROUTE_MAP[v3Path] ?? (v3Path.replace(/\.php$/, "").replace(/\/$/, "") || "/");
}

/**
 * Get navigation items for a user in a specific application
 */
export async function getNavigation(
  user: AuthUser,
  app: string
): Promise<NavGroup[]> {
  const allPages = await db
    .select()
    .from(pages)
    .where(eq(pages.application, app));

  const accessiblePages: NavItem[] = [];

  for (const page of allPages) {
    // Check role access
    const roleAccess = parseJson(page.roleAccess) as (number | string)[] | null;
    if (roleAccess !== null && roleAccess !== undefined) {
      // ["*"] means any role (public), null means any authenticated
      if (Array.isArray(roleAccess) && roleAccess.length > 0) {
        const isWildcard = roleAccess.includes("*");
        if (!isWildcard && !user.roles.some((r) => roleAccess.includes(r))) continue;
      }
    }

    // Check permission access
    const permAccess = parseJson(page.permissionAccess) as string[] | null;
    if (permAccess && permAccess.length > 0) {
      if (!user.roles.includes(0)) {
        const hasAny = permAccess.some((p) => user.permissions.includes(p));
        if (!hasAny) continue;
      }
    }

    // Skip hidden pages from nav (but they're still accessible)
    if (page.hidden === 1) continue;

    const design = parseJson(page.design) as { icon?: string; title?: string } | null;
    const navGroup = parseJson(page.navGroup) as { group?: string; dropdown?: { icon: string; title: string } } | null;

    accessiblePages.push({
      pageId: page.pageId,
      page: mapRoute(page.page),
      title: design?.title || page.page,
      icon: design?.icon || "",
      group: navGroup?.group || null,
      dropdown: navGroup?.dropdown || null,
      hidden: page.hidden === 1,
      priority: page.priority,
    });
  }

  // Sort by priority
  accessiblePages.sort((a, b) => a.priority - b.priority);

  // Group by NavGroup
  const groups = new Map<string, NavGroup>();
  const ungrouped: NavItem[] = [];

  for (const item of accessiblePages) {
    if (!item.group) {
      ungrouped.push(item);
      continue;
    }

    const existing = groups.get(item.group);
    if (existing) {
      existing.items.push(item);
      if (item.dropdown && !existing.dropdown) {
        existing.dropdown = item.dropdown;
      }
    } else {
      groups.set(item.group, {
        name: item.group,
        items: [item],
        dropdown: item.dropdown || undefined,
      });
    }
  }

  const result: NavGroup[] = [];

  // Add ungrouped items as individual groups
  for (const item of ungrouped) {
    result.push({ name: item.title, items: [item] });
  }

  // Add named groups
  for (const group of groups.values()) {
    result.push(group);
  }

  return result;
}
