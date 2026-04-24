"use client"

import { useMemo } from "react"
import { Building, Mail, Phone, Calendar, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DefaultersClientProps {
  overdueItems: any[]
  payments: any[]
  projectMap: Record<string, string>
}

export function DefaultersClient({ overdueItems, payments, projectMap }: DefaultersClientProps) {
  const defaulters = useMemo(() => {
    const map = new Map()

    overdueItems.forEach(item => {
      const sh = item.shareholder
      if (!sh) return
      
      const shId = sh.id
      // Use project_id from shareholder record if direct link is missing
      const projectId = sh.project_id

      // Key by project + unit to handle users with multiple properties
      const key = `${projectId}-${sh.unit_flat}`

      if (!map.has(key)) {
        map.set(key, {
          projectId,
          projectName: projectMap[projectId] || "Unknown Project",
          unit: sh.unit_flat,
          name: typeof sh.profiles === 'object' && sh.profiles !== null ? (sh.profiles as any).name : "Unknown",
          email: typeof sh.profiles === 'object' && sh.profiles !== null ? (sh.profiles as any).email : null,
          phone: typeof sh.profiles === 'object' && sh.profiles !== null ? (sh.profiles as any).phone : null,
          overdueCount: 0,
          totalPrincipal: 0,
          totalPenalty: 0,
          oldestDue: new Date(item.due_date)
        })
      }

      const d = map.get(key)
      d.overdueCount++

      // Calculate paid so far for this specific item
      const paid = payments
        .filter(p => p.schedule_item_id === item.id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      
      const principalDue = Math.max(0, (parseFloat(item.amount) || 0) - paid)
      d.totalPrincipal += principalDue

      // Calculate penalties
      if (item.penalties) {
        d.totalPenalty += item.penalties
          .filter((p: any) => !p.is_waived)
          .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
      }

      const itemDate = new Date(item.due_date)
      if (itemDate < d.oldestDue) d.oldestDue = itemDate
    })

    return Array.from(map.values()).sort((a, b) => b.totalPrincipal - a.totalPrincipal)
  }, [overdueItems, payments, projectMap])

  return (
    <div className="overflow-x-auto">
      <div>
        <Table>
          <TableHeader className="bg-surface-variant/20">
            <TableRow>
              <TableHead className="font-semibold text-on-surface px-6 py-4">Shareholder Name</TableHead>
              <TableHead className="font-semibold text-on-surface">Phone Number</TableHead>
              <TableHead className="font-semibold text-on-surface">Overdue Status</TableHead>
              <TableHead className="text-right font-semibold text-on-surface">Principal Due</TableHead>
              <TableHead className="text-right font-semibold text-destructive">Active Penalty</TableHead>
              <TableHead className="text-right font-bold text-on-surface pr-6">Total Owed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaulters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-outline">
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No active defaulters</p>
                    <p className="text-sm">All shareholders are currently up to date on payments.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              defaulters.map((d, i) => (
                <TableRow key={i} className="hover:bg-surface-variant/20 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {d.name}
                      </span>
                      <span className="text-xs text-on-surface-variant mt-0.5">
                        Unit: {d.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                      <Phone className="w-3.5 h-3.5 text-outline" />
                      {d.phone || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                        {d.overdueCount} Items Overdue
                      </span>
                      <span className="text-[10px] text-outline mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Since {d.oldestDue.toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ৳ {d.totalPrincipal.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    ৳ {d.totalPenalty.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-on-surface pr-6">
                    ৳ {(d.totalPrincipal + d.totalPenalty).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
