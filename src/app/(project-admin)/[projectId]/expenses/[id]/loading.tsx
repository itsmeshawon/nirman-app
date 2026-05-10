import { Skeleton } from "@/components/ui/skeleton"

export default function ExpenseDetailLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-6 w-24 rounded-full ml-auto" />
      </div>

      {/* Detail card */}
      <div className="border border-outline-variant/40 rounded-[1.25rem] p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div className="border border-outline-variant/40 rounded-[1.25rem] p-6 space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
