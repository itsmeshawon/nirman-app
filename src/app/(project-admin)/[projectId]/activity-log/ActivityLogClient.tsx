"use client"

import { useState, useMemo } from "react"
import { Search, Calendar, FileText, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"

const ENTITY_LABELS: Record<string, string> = {
  activity_post: "Post",
  approval_config: "Approval Config",
  committee_member: "Committee",
  document: "Document",
  expense: "Expense",
  milestone: "Milestone",
  milestones: "Milestones",
  notification_config: "Notifications",
  package: "Package",
  payment: "Payment",
  payment_schedule: "Payment Schedule",
  penalty: "Penalty",
  penalty_config: "Penalty Config",
  profile: "Profile",
  project: "Project",
  project_admin: "Project Admin",
  schedule_items: "Schedule",
  shareholder: "Shareholder",
  user: "User",
}

const DETAIL_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  unit_flat: "Unit / Flat",
  status: "Status",
  newStatus: "Status",
  amount: "Amount",
  method: "Payment Method",
  receipt_no: "Receipt No.",
  title: "Title",
  description: "Description",
  category: "Category",
  type: "Type",
  due_date: "Due Date",
  deleted_at: "Deleted At",
  file_name: "File",
  fileName: "File",
  shareholder_id: "Shareholder",
  newRule: "Approval Rule",
  reviewAction: "Review",
  comment: "Comment",
  waived_amount: "Waived Amount",
  waive_reason: "Waive Reason",
  count: "Count",
  attachmentsCount: "Attachments",
  note: "Note",
  message: "Message",
  initialStatus: "Initial Status",
  updated_fields: "Updated Fields",
}

const SKIP_KEYS = new Set(["ids", "milestone_id", "tags"])

function formatDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "string") {
    // ISO date strings
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    }
    // Enum-style values: snake_case → Title Case
    if (/^[A-Z_]+$/.test(value)) return value.replace(/_/g, " ")
    return value
  }
  if (typeof value === "number") {
    if (key === "amount" || key === "waived_amount") {
      return `৳ ${value.toLocaleString("en-BD")}`
    }
    return String(value)
  }
  return String(value)
}

interface AuditLog {
  id: string
  action: string
  entity_type: string | null
  details: Record<string, unknown> | null
  created_at: string
  user_id: string | null
}

interface ActivityLogClientProps {
  logs: AuditLog[]
}

export default function ActivityLogClient({ logs }: ActivityLogClientProps) {
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        log.action.toLowerCase().includes(searchLower) ||
        (log.entity_type ?? "").toLowerCase().includes(searchLower) ||
        (log.user_id ?? "").toLowerCase().includes(searchLower)

      const logDate = new Date(log.created_at)
      const matchesFrom = !fromDate || logDate >= new Date(fromDate)
      const matchesTo = !toDate || logDate <= new Date(toDate + "T23:59:59")

      return matchesSearch && matchesFrom && matchesTo
    })
  }, [logs, search, fromDate, toDate])

  const clearFilters = () => {
    setSearch("")
    setFromDate("")
    setToDate("")
  }

  const hasFilters = search || fromDate || toDate

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder="Search by action or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface-container-low border-outline-variant/40 rounded-full"
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="pl-9 bg-surface-container-low border-outline-variant/40 rounded-full w-40"
              title="From date"
            />
          </div>
          <span className="text-on-surface-variant text-sm">to</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="pl-9 bg-surface-container-low border-outline-variant/40 rounded-full w-40"
              title="To date"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-full h-9 px-3 text-on-surface-variant hover:text-on-surface"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-on-surface-variant ml-1">
        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}{hasFilters ? " found" : " total"}
      </p>

      {/* Log List */}
      <div className="rounded-xl border border-outline-variant/40 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-outline">
            {hasFilters ? "No entries match your filters." : "No activity logged yet."}
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {filtered.map((log) => (
              <li key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-container-low/50 transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-on-surface">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    {log.entity_type && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-primary-container/20 text-primary border border-primary-container/30">
                        {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                      </span>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-outline break-words">
                      {Object.entries(log.details)
                        .filter(([k, v]) => v !== null && v !== undefined && !SKIP_KEYS.has(k))
                        .map(([k, v]) => `${DETAIL_LABELS[k] ?? k}: ${formatDetailValue(k, v)}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-outline mt-1">{formatDateTime(log.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
