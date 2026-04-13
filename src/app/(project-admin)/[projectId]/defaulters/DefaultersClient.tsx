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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[1.25rem] border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Active Defaulters</h2>
          <p className="text-gray-500 mt-1">Real-time overview of shareholders with overdue collections.</p>
        </div>
        <Button 
          onClick={handleApplyPenalties} 
          disabled={isProcessing} 
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100"
        >
          <Settings2 className="w-4 h-4 mr-2" /> 
          {isProcessing ? "Processing..." : "Trigger Penalty Sweep"}
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[1.25rem] shadow-eos-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900 px-6 py-4">Shareholder</TableHead>
                <TableHead className="font-semibold text-gray-900">Phone</TableHead>
                <TableHead className="font-semibold text-gray-900">Overdue Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-900">Principal Due</TableHead>
                <TableHead className="text-right font-semibold text-red-600">Active Penalty</TableHead>
                <TableHead className="text-right font-bold text-gray-900 px-6">Total Owed</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaulters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertTriangle className="w-12 h-12 mb-4 opacity-10 text-green-500" />
                      <p className="text-lg font-medium text-gray-600">No active defaulters</p>
                      <p className="text-sm">Great! All shareholders are currently up to date on payments.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                defaulters.map((d, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {d.name}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          Unit: {d.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {d.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md w-fit uppercase">
                          {d.overdueCount} Items Overdue
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Since {d.oldestDue.toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      ৳ {d.totalPrincipal.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      ৳ {d.totalPenalty.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-black text-gray-900 px-6">
                      ৳ {(d.totalPrincipal + d.totalPenalty).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button variant="outline" size="sm" className="text-indigo-600 hover:text-indigo-800 border-indigo-100 hover:bg-indigo-50 font-semibold h-8">
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
