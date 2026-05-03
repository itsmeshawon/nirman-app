import { Skeleton } from "@/components/ui/skeleton"

export default function CommitteeLoading() {
  return (
    <div className="space-y-6">
      {/* Approval rule card */}
      <div className="rounded-xl border border-outline-variant/40 p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </div>

      {/* Add member row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Member cards */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
