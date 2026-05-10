import { Skeleton } from "@/components/ui/skeleton"

export default function SuperAdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Recent projects table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-surface-variant/20 h-12 px-4 flex items-center">
          <Skeleton className="h-5 w-36" />
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
