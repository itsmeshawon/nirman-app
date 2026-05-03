import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-outline-variant/40 p-5 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>

      {/* Report tabs */}
      <div className="border-b border-outline-variant/40 flex gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-32" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-outline-variant/20 flex gap-4">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
