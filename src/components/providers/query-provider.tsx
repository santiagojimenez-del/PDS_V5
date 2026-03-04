"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute — avoids redundant refetches
            // when navigating between pages or re-mounting components.
            staleTime: 60 * 1000,

            // Keep unused data in cache for 5 minutes before garbage collecting.
            gcTime: 5 * 60 * 1000,

            // Retry once on error (default 3 retries feels slow in internal apps).
            retry: 1,

            // Don't refetch when the user switches tabs — internal app, not real-time.
            refetchOnWindowFocus: false,

            // Refetch when the user comes back online after losing connectivity.
            refetchOnReconnect: true,
          },
          mutations: {
            // Don't retry mutations — side effects should not be silently duplicated.
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
