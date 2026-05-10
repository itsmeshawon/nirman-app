import { Skeleton } from "@/components/ui/skeleton"

export default function DefaultersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-[1.25rem]" />
        ))}
      </div>

      {/* Table */}
      <div className="border border-outline-variant/40 rounded-[1.25rem] overflow-hidden">
        <div className="bg-surface-variant/20 h-11 w-full" />
        <div className="divide-y divide-outline-variant/20">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
