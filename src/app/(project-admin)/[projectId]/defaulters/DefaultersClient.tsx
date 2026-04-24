"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Phone, Calendar, AlertTriangle, Settings2, Mail } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DefaultersClientProps {
  projectId: string
  overdueItems: any[]
  payments: any[]
}

export function DefaultersClient({ projectId, overdueItems, payments }: DefaultersClientProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const defaulters = useMemo(() => {
    const map = new Map()

    overdueItems.forEach(item => {
      const sh = item.shareholder
      if (!sh) return
      
      const shId = sh.id
      const key = shId

      if (!map.has(key)) {
        map.set(key, {
          id: shId,
          unit: sh.unit_flat,
          name: sh.profiles?.name || "Unknown",
          phone: sh.profiles?.phone || "N/A",
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
  }, [overdueItems, payments])

  const handleApplyPenalties = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/penalties/apply`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Penalty sweeps completed.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 bg-[var(--surface-container-low)] p-8 rounded-[28px] border border-[var(--outline-variant)]/30">
        <Button 
          onClick={handleApplyPenalties} 
          disabled={isProcessing} 
          variant="default"
          className=""
        >
          <Settings2 className="w-4 h-4 mr-2" /> 
          {isProcessing ? "Processing..." : "Trigger Penalty Sweep"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Shareholder</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Overdue Status</TableHead>
                <TableHead className="text-right">Principal Due</TableHead>
                <TableHead className="text-right text-[var(--destructive)]">Active Penalty</TableHead>
                <TableHead className="text-right px-6">Total Owed</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaulters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-outline">
                      <AlertTriangle className="w-12 h-12 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-on-surface-variant">No active defaulters</p>
                      <p className="text-sm">Great! All shareholders are currently up to date on payments.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                defaulters.map((d, i) => (
                  <TableRow key={i} className="group">
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-[var(--foreground)]">
                          {d.name}
                        </span>
                        <span className="text-[12px] text-[var(--on-surface-variant)] mt-0.5">
                          Unit: {d.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--on-surface-variant)]">
                        <Phone className="w-3.5 h-3.5 text-[var(--m3-outline)]" />
                        {d.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#964B00] bg-[#FFDDB3] px-3 py-1 rounded-full w-fit uppercase tracking-wider">
                          {d.overdueCount} Items Overdue
                        </span>
                        <span className="text-[11px] text-[var(--on-surface-variant)] mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Since {d.oldestDue.toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-on-surface">
                      ৳ {d.totalPrincipal.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      ৳ {d.totalPenalty.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-black text-on-surface px-6">
                      ৳ {(d.totalPrincipal + d.totalPenalty).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button variant="outline" size="sm" className="h-8">
                        <Mail className="w-3.5 h-3.5 mr-2" /> Remind
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
