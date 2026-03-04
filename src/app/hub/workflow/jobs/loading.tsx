import { Skeleton } from "@/components/ui/skeleton";

export default function JobsLoading() {
  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-2">
            {/* Column header */}
            <Skeleton className="h-8 w-full rounded-lg" />
            {/* Cards */}
            {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
