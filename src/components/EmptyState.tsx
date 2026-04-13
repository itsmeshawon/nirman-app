import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 py-12 bg-white rounded-2xl border border-dashed border-gray-200",
      className
    )}>
      <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mt-1 mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-indigo-700 hover:bg-indigo-800"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
