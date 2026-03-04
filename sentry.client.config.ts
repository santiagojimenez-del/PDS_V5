import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions in production, 100% in dev/staging
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture 100% of session replays on errors
  replaysOnErrorSampleRate: 1.0,

  // Capture 1% of all sessions for replay
  replaysSessionSampleRate: 0.01,

  debug: false,
});
