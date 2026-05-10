import { Skeleton } from "@/components/ui/skeleton"

export default function SuperAdminProjectDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-20 rounded-full ml-auto" />
      </div>

      {/* Project info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border rounded-xl p-5 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="border rounded-xl p-5 space-y-3">
            <Skeleton className="h-6 w-28" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Shareholders table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-surface-variant/20 h-12 px-4 flex items-center gap-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16 rounded-full ml-auto" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
