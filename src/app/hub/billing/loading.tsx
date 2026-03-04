import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      {/* Header + action */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Invoice table */}
      <div className="rounded-xl border">
        <Skeleton className="h-12 w-full rounded-t-xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 my-2 h-12 w-[calc(100%-2rem)]" />
        ))}
      </div>
    </div>
  );
}
