import { Skeleton } from "@/components/ui/skeleton"

export default function ActivityLogLoading() {
  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex gap-3 flex-wrap">
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      {/* Log entries */}
      <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-outline-variant/20">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
