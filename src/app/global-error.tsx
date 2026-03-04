"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            backgroundColor: "#f9fafb",
            padding: "1rem",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Critical Error
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              A critical error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
