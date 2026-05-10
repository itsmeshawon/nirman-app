import { Skeleton } from "@/components/ui/skeleton"

export default function ShareholderPaymentsLoading() {
  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[1.25rem]" />
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant/40">
        <div className="flex gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
      </div>

      {/* Table area */}
      <div className="border border-outline-variant/40 rounded-[1.25rem] overflow-hidden">
        <div className="bg-surface-variant/20 h-12 w-full" />
        <div className="divide-y divide-outline-variant/20">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
