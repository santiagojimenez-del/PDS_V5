import { db } from "@/lib/db";
import { configuration } from "@/lib/db/schema";
import { cache } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import { eq, or } from "drizzle-orm";
import type { AppConfig } from "../types";

const CACHE_KEY_PREFIX = "config:";

function tryParseJSON(value: string): unknown {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" || Array.isArray(parsed)) {
      return parsed;
    }
    return value;
  } catch {
    return value;
  }
}

/**
 * Load configuration for a specific application.
 * App-specific values override global ("") values.
 */
export async function getConfig(app: string): Promise<AppConfig> {
  const cacheKey = `${CACHE_KEY_PREFIX}${app || "global"}`;
  const cached = cache.get<AppConfig>(cacheKey);
  if (cached) return cached;

  const rows = await db
    .select()
    .from(configuration)
    .where(or(eq(configuration.application, "*"), eq(configuration.application, app)));

  const config: AppConfig = {};

  // First pass: set global values (Application = "*")
  for (const row of rows) {
    if (row.application === "*") {
      config[row.name] = tryParseJSON(row.value) as AppConfig[string];
    }
  }

  // Second pass: override with app-specific values
  for (const row of rows) {
    if (row.application === app && app !== "*") {
      config[row.name] = tryParseJSON(row.value) as AppConfig[string];
    }
  }

  cache.set(cacheKey, config, CACHE_TTL.CONFIGURATION);
  return config;
}

/**
 * Get a single configuration value.
 */
export async function getConfigValue<T = string>(
  app: string,
  key: string
): Promise<T | null> {
  const config = await getConfig(app);
  return (config[key] as T) ?? null;
}

/**
 * Invalidate configuration cache for an app.
 */
export function invalidateConfig(app?: string): void {
  if (app) {
    cache.delete(`${CACHE_KEY_PREFIX}${app}`);
  } else {
    cache.delete(`${CACHE_KEY_PREFIX}global`);
    cache.delete(`${CACHE_KEY_PREFIX}hub`);
    cache.delete(`${CACHE_KEY_PREFIX}client`);
    cache.delete(`${CACHE_KEY_PREFIX}admin`);
  }
}
