import { Skeleton } from "@/components/ui/skeleton"

export default function ReceiptLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Print button row */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Receipt card */}
      <div className="border border-outline-variant/40 rounded-[1.25rem] p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-36 mx-auto" />
        </div>

        <div className="border-t border-outline-variant/40" />

        {/* Details rows */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>

        <div className="border-t border-outline-variant/40" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-7 w-32" />
        </div>
      </div>
    </div>
  )
}
