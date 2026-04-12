import { Skeleton } from "@/components/ui/skeleton"

export default function ShareholderDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome banner personal */}
      <Skeleton className="h-36 w-full rounded-2xl" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl shadow-sm" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Summary Card */}
        <Skeleton className="h-64 rounded-2xl shadow-sm" />
        {/* Project Progress Card */}
        <Skeleton className="h-64 rounded-2xl shadow-sm" />
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl shadow-sm" />
      </div>
    </div>
  )
}
