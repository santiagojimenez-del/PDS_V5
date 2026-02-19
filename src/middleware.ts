import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VALID_APPS = ["hub", "client", "admin"] as const;
type AppName = (typeof VALID_APPS)[number];

const AUTH_PAGES = ["login", "register", "forgot-password", "reset-password"];

const SKIP_PREFIXES = ["/api/", "/_next/", "/favicon.ico", "/img/", "/tiles/"];

const STATIC_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".css", ".js", ".woff", ".woff2", ".ttf", ".map", ".webp",
];

// ── Maintenance mode cache (module-level, 30s TTL) ───────────────────────────
let maintenanceCache: { value: boolean; expires: number } | null = null;

async function checkMaintenanceMode(request: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && maintenanceCache.expires > now) {
    return maintenanceCache.value;
  }
  try {
    // Build the internal URL using the incoming request host
    const url = new URL("/api/maintenance-status", request.nextUrl.origin);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) { maintenanceCache = { value: false, expires: now + 30_000 }; return false; }
    const json = await res.json();
    const value = json.maintenance === true;
    maintenanceCache = { value, expires: now + 30_000 };
    return value;
  } catch {
    // Can't reach status endpoint — don't block anyone
    maintenanceCache = { value: false, expires: now + 10_000 };
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveApp(request: NextRequest): AppName {
  const appParam = request.nextUrl.searchParams.get("app");
  if (appParam && VALID_APPS.includes(appParam as AppName)) {
    return appParam as AppName;
  }

  const hostname = request.headers.get("host") || "localhost:3003";
  const hostWithoutPort = hostname.split(":")[0];

  if (hostWithoutPort.includes(".")) {
    const subdomain = hostWithoutPort.split(".")[0];
    if (VALID_APPS.includes(subdomain as AppName)) {
      return subdomain as AppName;
    }
  }

  return "hub";
}

function shouldSkip(pathname: string): boolean {
  for (const prefix of SKIP_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  const lower = pathname.toLowerCase();
  for (const ext of STATIC_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function isAuthPage(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0];
  return AUTH_PAGES.includes(segment || "");
}

// Paths that are already prefixed with an app directory - don't double-rewrite
function isAlreadyPrefixed(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0];
  return ["hub", "client", "admin", "auth", "viewer", "maintenance"].includes(segment || "");
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // Don't rewrite if already targeting an app directory or maintenance page
  if (isAlreadyPrefixed(pathname)) {
    return NextResponse.next();
  }

  // Auth pages → rewrite to /auth/* (also allows login during maintenance)
  if (isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/auth${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Maintenance mode: only block unauthenticated users
  // Authenticated users (any role) can always access the system
  const sessionCookie = request.cookies.get("pds_session");
  if (!sessionCookie?.value) {
    // Check maintenance before showing login redirect
    const inMaintenance = await checkMaintenanceMode(request);
    if (inMaintenance && pathname !== "/maintenance") {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }

    // Not in maintenance — redirect to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Share token present → bypass auth and rewrite to /shared handler
  const shareToken = request.nextUrl.searchParams.get("share_token");
  if (shareToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/shared";
    return NextResponse.rewrite(url);
  }

  // Rewrite to the correct app directory: /* → /hub/*, /client/*, /admin/*
  const app = resolveApp(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${app}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
