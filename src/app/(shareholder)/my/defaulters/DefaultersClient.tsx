"use client"

import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DefaulterRow {
  shareholderName: string
  phone: string | null
  unit: string
  milestoneName: string | null
  dueDate: Date
  installmentAmount: number
  paid: number
  principalDue: number
  penalty: number
}

interface DefaultersClientProps {
  overdueItems: any[]
  payments: any[]
  projectMap: Record<string, string>
}

export function DefaultersClient({ overdueItems, payments }: DefaultersClientProps) {
  const defaulters = useMemo<DefaulterRow[]>(() => {
    return overdueItems
      .map((item): DefaulterRow | null => {
        const sh = item.shareholder
        if (!sh) return null

        const paid = payments
          .filter(p => p.schedule_item_id === item.id)
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

        const installmentAmount = parseFloat(item.amount) || 0
        const principalDue = Math.max(0, installmentAmount - paid)

        const penalty = (item.penalties || [])
          .filter((p: any) => !p.is_waived && parseFloat(p.amount) > 0)
          .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

        return {
          shareholderName: sh.profiles?.name || "Unknown",
          phone: sh.profiles?.phone || null,
          unit: sh.unit_flat,
          milestoneName: item.milestone?.name || null,
          dueDate: new Date(item.due_date),
          installmentAmount,
          paid,
          principalDue,
          penalty,
        }
      })
      .filter((r): r is DefaulterRow => r !== null)
      .sort((a, b) => b.principalDue - a.principalDue)
  }, [overdueItems, payments])

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6">Shareholder</TableHead>
            <TableHead>Payment Type / Milestone</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Expected (৳)</TableHead>
            <TableHead className="text-right">Paid (৳)</TableHead>
            <TableHead className="text-right">Due (৳)</TableHead>
            <TableHead className="text-right text-[var(--destructive)]">Penalty (৳)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {defaulters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20">
                <div className="flex flex-col items-center justify-center text-outline">
                  <AlertTriangle className="w-12 h-12 mb-4 opacity-10 text-primary" />
                  <p className="text-lg font-medium text-on-surface-variant">No active defaulters</p>
                  <p className="text-sm">All shareholders are currently up to date on payments.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            defaulters.map((d, i) => (
              <TableRow key={i} className="group">
                <TableCell className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[var(--foreground)]">
                      {d.shareholderName}
                    </span>
                    <span className="text-[12px] text-[var(--on-surface-variant)] mt-0.5">
                      {d.phone ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-on-surface">
                  {d.milestoneName || "General (Monthly Payment)"}
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-bold text-[#964B00] bg-[#FFDDB3] px-3 py-1 rounded-full uppercase tracking-wider">
                    {d.dueDate.toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-on-surface-variant">
                  ৳ {d.installmentAmount.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right text-sm text-primary font-semibold">
                  ৳ {d.paid.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right font-medium text-on-surface">
                  ৳ {d.principalDue.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right font-medium text-destructive">
                  ৳ {d.penalty.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
