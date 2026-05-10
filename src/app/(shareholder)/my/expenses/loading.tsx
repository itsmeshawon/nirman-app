import { Skeleton } from "@/components/ui/skeleton"

export default function ShareholderExpensesLoading() {
  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="min-w-[110px] h-16 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Table */}
      <div className="border border-outline-variant/40 rounded-[1.25rem] overflow-hidden">
        <div className="bg-surface-variant/20 h-11 w-full" />
        <div className="divide-y divide-outline-variant/20">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
