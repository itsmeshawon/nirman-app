import { Skeleton } from "@/components/ui/skeleton"

export default function ShareholderFeedLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-outline-variant/40 rounded-[1.25rem] overflow-hidden">
          {/* Post header */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {/* Post body */}
          <div className="px-5 pb-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          {/* Post image placeholder */}
          {i % 2 === 0 && <Skeleton className="h-52 w-full rounded-none" />}
          {/* Reaction row */}
          <div className="flex gap-4 px-5 py-3">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
