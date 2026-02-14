/**
 * Client-side helpers for deliverable JSON parsing/stringifying.
 * These are re-exported from the service but without server-side DB imports.
 */

export function parseDeliverableJSON<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function stringifyDeliverableJSON(value: unknown): string {
  return JSON.stringify(value);
}
