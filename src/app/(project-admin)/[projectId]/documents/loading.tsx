import { Skeleton } from "@/components/ui/skeleton"

export default function DocumentsLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />

      <div className="bg-surface rounded-xl border overflow-hidden">
        <div className="bg-surface-variant/20 h-11 border-b" />
        <div className="divide-y divide-gray-100">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
