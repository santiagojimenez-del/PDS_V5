import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while an auth page (login, register, reset-password, etc.) is loading.
 * Renders as full screen to match the auth layout.
 */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Logo placeholder */}
        <div className="flex justify-center">
          <Skeleton className="h-12 w-40" />
        </div>
        {/* Card skeleton */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
