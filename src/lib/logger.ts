/**
 * Centralized logger — wraps Sentry on the server side and falls back to
 * console on the client or when Sentry is not configured.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.error("Something failed", err, { userId: 42 });
 *   logger.warn("Soft limit reached", { pilotId: 10 });
 *   logger.info("Job scheduled", { jobId: 99 });
 */

import type { SeverityLevel } from "@sentry/nextjs";

type LogContext = Record<string, unknown>;

function isBrowser() {
  return typeof window !== "undefined";
}

function sentryAvailable() {
  return !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN;
}

async function captureToSentry(
  level: SeverityLevel,
  message: string,
  error?: unknown,
  context?: LogContext
) {
  if (!sentryAvailable()) return;

  try {
    const Sentry = await import("@sentry/nextjs");

    Sentry.withScope((scope) => {
      scope.setLevel(level);

      if (context) {
        scope.setContext("details", context);
      }

      if (error instanceof Error) {
        Sentry.captureException(error, { extra: { message, ...context } });
      } else {
        Sentry.captureMessage(
          error ? `${message}: ${String(error)}` : message
        );
      }
    });
  } catch {
    // Sentry import failed — swallow silently, console fallback below handles it
  }
}

export const logger = {
  /**
   * Capture an error. Also reports to Sentry when DSN is configured.
   */
  error(message: string, error?: unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error ?? "", context ?? "");
    if (!isBrowser()) {
      captureToSentry("error", message, error, context);
    }
  },

  /**
   * Log a warning. Reports to Sentry as a warning-level message.
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context ?? "");
    if (!isBrowser()) {
      captureToSentry("warning", message, undefined, context);
    }
  },

  /**
   * Informational log. Only sent to Sentry in production.
   */
  info(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[INFO] ${message}`, context ?? "");
    }
    if (!isBrowser() && process.env.NODE_ENV === "production") {
      captureToSentry("info", message, undefined, context);
    }
  },

  /**
   * Debug log — only printed in development, never sent to Sentry.
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, context ?? "");
    }
  },
};
