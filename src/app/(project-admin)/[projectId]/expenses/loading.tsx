import { Skeleton } from "@/components/ui/skeleton"

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      {/* Pipeline Badges skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="min-w-[120px] h-20 rounded-xl" />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-surface-variant/20 h-10 w-full" />
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
