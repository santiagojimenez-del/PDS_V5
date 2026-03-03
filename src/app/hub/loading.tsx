import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown automatically by Next.js while any hub route is loading.
 * Renders within the existing AppShell (sidebar + navbar remain visible).
 */
export default function HubLoading() {
  return (
    <div className="space-y-6 p-1">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Action bar */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      {/* Main content block */}
      <Skeleton className="h-64 w-full rounded-xl" />

      {/* Secondary content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
