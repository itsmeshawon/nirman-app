"use client"

import { useState, useMemo } from "react"
import { Search, Calendar, FileText, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"

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
      <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
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
                        {log.entity_type}
                      </span>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-outline truncate max-w-xl">
                      {Object.entries(log.details)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([k, v]) => `${k}: ${v}`)
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
