import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentsLoading() {
  return (
    <div className="space-y-8">
      {/* Header and Financial Overview */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-outline-variant/50">
        <div className="flex space-x-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-surface-variant/20 border rounded-xl p-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="border rounded-xl h-64 overflow-hidden">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      </div>
    </div>
  )
}
