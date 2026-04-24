import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Mail, Settings2 } from "lucide-react"

export function DefaultersTab({ projectId, scheduleItems, payments }: { projectId: string, scheduleItems: any[], payments: any[] }) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  // A defaulter has at least one OVERDUE item.
  // Group by shareholder.
  const defaulterMap = new Map()

  scheduleItems.forEach(item => {
    if (item.status === 'OVERDUE') {
       const shId = item.shareholder_id
       if (!defaulterMap.has(shId)) {
          defaulterMap.set(shId, {
             shareholder: item.shareholder,
             overdueCount: 0,
             totalOverdue: 0,
             totalPenalty: 0,
             oldestDue: new Date(item.due_date)
          })
       }
       
       const d = defaulterMap.get(shId)
       d.overdueCount++
       
       // calculate remaining unpaid amount for this specific item
       const paidSoFar = payments.filter(p => p.schedule_item_id === item.id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
       const leftToPay = (parseFloat(item.amount) || 0) - paidSoFar
       
       d.totalOverdue += leftToPay

       // Penalties
       if (item.penalties) {
          d.totalPenalty += item.penalties.filter((p:any) => !p.is_waived).reduce((sum:number, p:any) => sum + (parseFloat(p.amount) || 0), 0)
       }

       const iDate = new Date(item.due_date)
       if (iDate < d.oldestDue) d.oldestDue = iDate
    }
  })

  const defaulters = Array.from(defaulterMap.values()).sort((a, b) => b.totalOverdue - a.totalOverdue)

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
    <div>
       <div className="p-4 border-b bg-orange-50 flex justify-between items-center">
         <div>
            <h3 className="text-lg font-semibold text-orange-900">Active Defaulters</h3>
            <p className="text-sm text-orange-700">Shareholders with overdue collections</p>
         </div>
         <Button onClick={handleApplyPenalties} disabled={isProcessing} className="bg-orange-600 hover:bg-orange-700">
            <Settings2 className="w-4 h-4 mr-2" /> Trigger Penalty Engine Sweep
         </Button>
       </div>

       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shareholder</TableHead>
              <TableHead>Overdue Items</TableHead>
              <TableHead>Oldest Due</TableHead>
              <TableHead className="text-right">Overdue Principal (৳)</TableHead>
              <TableHead className="text-right text-destructive">Active Penalty (৳)</TableHead>
              <TableHead className="text-right font-bold">Total Due (৳)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaulters.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-8 text-on-surface-variant">No overdue collections found. All clear!</TableCell>
               </TableRow>
            ) : (
               defaulters.map((d, i) => (
                 <TableRow key={i}>
                    <TableCell>
                      <div className="text-sm font-semibold text-on-surface">{d.shareholder?.profiles?.name}</div>
                      <div className="text-xs text-on-surface-variant">Unit: {d.shareholder?.unit_flat}</div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{d.overdueCount} items</TableCell>
                    <TableCell className="text-sm text-on-surface-variant">{d.oldestDue.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium text-on-surface">{d.totalOverdue.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-sm text-destructive font-semibold">{d.totalPenalty.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold text-on-surface">{(d.totalOverdue + d.totalPenalty).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="text-tertiary hover:text-on-tertiary-container hover:bg-tertiary-container/20">
                          <Mail className="w-4 h-4 mr-2" /> Remind
                       </Button>
                    </TableCell>
                 </TableRow>
               ))
            )}
          </TableBody>
       </Table>
    </div>
  )
}
