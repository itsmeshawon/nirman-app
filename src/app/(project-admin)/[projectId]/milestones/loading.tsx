import { Skeleton } from "@/components/ui/skeleton"

export default function MilestonesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              {i < 4 && <Skeleton className="w-0.5 h-16 mt-1" />}
            </div>
            <div className="flex-1 rounded-xl border border-outline-variant/40 p-5 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-6">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
