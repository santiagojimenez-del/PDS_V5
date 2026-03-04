import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Skeleton className="h-12 w-full rounded-t-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 my-2 h-14 w-[calc(100%-2rem)]" />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
