import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Section: Project */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-xl border border-outline-variant/40 p-5 space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Section: Payment Schedule */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-44" />
        <div className="rounded-xl border border-outline-variant/40 p-5 space-y-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Section: Penalty */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-xl border border-outline-variant/40 p-5 space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
