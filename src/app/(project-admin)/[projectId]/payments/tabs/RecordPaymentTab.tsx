import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Info, AlertCircle, Ban } from "lucide-react"

export function RecordPaymentTab({ 
  projectId, 
  scheduleItems, 
  shareholders,
  payments 
}: { 
  projectId: string, 
  scheduleItems: any[], 
  shareholders: any[],
  payments: any[] 
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [shareholderId, setShareholderId] = useState("")
  const [scheduleItemId, setScheduleItemId] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("BANK_TRANSFER")
  const [referenceNo, setReferenceNo] = useState("")
  const [notes, setNotes] = useState("")
  const [waivePenalties, setWaivePenalties] = useState(false)

  // Calculate Due Summary for Selected Shareholder
  const dueSummary = useMemo(() => {
    if (!shareholderId) return null

    const shItems = scheduleItems.filter(item => item.shareholder_id === shareholderId)
    let totalPrincipal = 0
    let totalPenalty = 0
    const itemBreakdown: any[] = []

    shItems.forEach(item => {
      // Calculate paid so far for this item
      const paid = payments
        .filter(p => p.schedule_item_id === item.id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      
      const leftToPay = (parseFloat(item.amount) || 0) - paid

      if (leftToPay > 0 && (item.status === 'OVERDUE' || item.status === 'DUE' || item.status === 'PARTIALLY_PAID')) {
        totalPrincipal += leftToPay
        itemBreakdown.push({
          name: item.milestone?.name || "Payment Installment",
          date: item.due_date,
          amount: leftToPay,
          status: item.status
        })
      }

      // Penalties
      if (item.penalties) {
        const activePenalties = item.penalties
          .filter((p: any) => !p.is_waived)
          .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
        totalPenalty += activePenalties
      }
    })

    return { totalPrincipal, totalPenalty, itemBreakdown }
  }, [shareholderId, scheduleItems, payments])

  const activeSchedules = scheduleItems.filter(item => 
    item.shareholder_id === shareholderId && 
    (item.status === 'DUE' || item.status === 'OVERDUE' || item.status === 'PARTIALLY_PAID')
  )

  const handleCreate = async () => {
    if (!shareholderId || !amount || !method) {
       toast.error("Please fill in shareholder, amount, and payment method.")
       return
    }

    setIsSubmitting(true)
    try {
       const res = await fetch(`/api/projects/${projectId}/payments`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           shareholder_id: shareholderId,
           schedule_item_id: scheduleItemId && scheduleItemId !== "none" ? scheduleItemId : null,
           amount: parseFloat(amount) || 0,
           method,
           reference_no: referenceNo,
           notes,
           waive_penalties: waivePenalties
         })
       })

       const data = await res.json()
       if (!res.ok) throw new Error(data.error)

       toast.success(`Payment recorded successfully! Receipt: ${data.payment.receipt_no}`)
       
       // Form Reset
       setAmount("")
       setReferenceNo("")
       setScheduleItemId("")
       setNotes("")
       setWaivePenalties(false)
       
       router.refresh()
    } catch (err: any) {
       toast.error(err.message)
    } finally {
       setIsSubmitting(false)
    }
  }

  const shName = shareholders.find(s => s.id === shareholderId)?.profiles?.name
  const methodName = method.replace("_", " ")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Recording Form */}
      <div className="lg:col-span-2 bg-white border rounded-[1.25rem] shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Record New Payment</h2>
          <p className="text-sm text-gray-500 mt-1">Submit a manual payment record for a shareholder.</p>
        </div>

        <div className="space-y-6">
           <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Select Shareholder *</Label>
              <Select value={shareholderId} onValueChange={(v) => { setShareholderId(v ?? ""); setScheduleItemId(""); }}>
                 <SelectTrigger className="h-11">
                    <span className="flex-1 text-left truncate">
                      {shName ? shName : <span className="text-muted-foreground">Select a shareholder profile</span>}
                    </span>
                 </SelectTrigger>
                 <SelectContent>
                   {shareholders.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.profiles?.name} (Unit: {s.unit_flat})</SelectItem>
                   ))}
                 </SelectContent>
              </Select>
           </div>

           {shareholderId && (
              <div className="space-y-2 p-5 bg-slate-50 border border-slate-100 rounded-xl transition-all animate-in fade-in zoom-in-95 duration-200">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link to Expected Schedule (Optional)</Label>
                 <Select value={scheduleItemId} onValueChange={(v) => setScheduleItemId(v ?? "")}>
                   <SelectTrigger className="bg-white">
                     <span className="flex-1 text-left truncate">
                        {scheduleItemId && scheduleItemId !== "none" ? `Linked to specific installment` : <span className="text-muted-foreground italic">Manual Ad-hoc Payment</span>}
                     </span>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">Manual Ad-hoc Payment (Unlinked)</SelectItem>
                     {activeSchedules.map(sch => (
                        <SelectItem key={sch.id} value={sch.id}>
                           {sch.milestone?.name || "Installment"} — ৳{parseFloat(sch.amount).toLocaleString('en-IN')} [Due {new Date(sch.due_date).toLocaleDateString()}]
                        </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Amount (৳) *</Label>
                 <Input className="h-11 text-lg font-semibold" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Payment Method *</Label>
                 <Select value={method} onValueChange={(v) => setMethod(v ?? "")}>
                   <SelectTrigger className="h-11">
                      <span className="flex-1 text-left truncate capitalize">{methodName.toLowerCase()}</span>
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="BKASH">bKash</SelectItem>
                      <SelectItem value="NAGAD">Nagad</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Reference Number / Check No.</Label>
              <Input className="h-11" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. Bank Ref #, bKash ID, Check Digit" />
           </div>

           <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Internal Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note for physical receipt location or specific instructions..." className="min-h-[100px]" />
           </div>

           {dueSummary && dueSummary.totalPenalty > 0 && (
             <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-100 rounded-xl">
               <Checkbox 
                id="waive" 
                checked={waivePenalties} 
                onCheckedChange={(checked) => setWaivePenalties(!!checked)}
                className="w-5 h-5 border-red-300 data-[state=checked]:bg-red-600"
               />
               <div className="grid gap-0.5 leading-none">
                 <label htmlFor="waive" className="text-sm font-bold text-red-900 cursor-pointer flex items-center gap-1.5 uppercase tracking-tight">
                   <Ban className="w-4 h-4" /> Waive All Active Penalties
                 </label>
                 <p className="text-xs text-red-700">Check this to remove ৳{dueSummary.totalPenalty.toLocaleString('en-IN')} in late fees for this user.</p>
               </div>
             </div>
           )}

           <div className="pt-6 border-t flex justify-end">
              <Button onClick={handleCreate} disabled={isSubmitting} className="h-12 px-8 bg-[#4F46E5] hover:bg-indigo-800 text-lg shadow-lg shadow-indigo-100 w-full sm:w-auto">
                 {isSubmitting ? "Recording..." : "Confirm & Record Payment"}
              </Button>
           </div>
        </div>
      </div>

      {/* Due Summary Side Panel */}
      <div className="space-y-6">
        {dueSummary ? (
          <div className="bg-white border rounded-[1.25rem] shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-900 p-6 text-white text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
              <h3 className="text-3xl font-black">৳{(dueSummary.totalPrincipal + (waivePenalties ? 0 : dueSummary.totalPenalty)).toLocaleString('en-IN')}</h3>
              {waivePenalties && dueSummary.totalPenalty > 0 && <p className="text-[10px] text-red-400 uppercase mt-2 font-bold flex items-center justify-center gap-1"><Ban className="w-3 h-3"/> Penalties Waived</p>}
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-tight">Principal</span>
                  <span className="text-lg font-bold text-gray-900">৳{dueSummary.totalPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-tight">Penalties</span>
                  <span className={`text-lg font-bold ${waivePenalties ? 'text-gray-300 line-through' : 'text-red-600'}`}>৳{dueSummary.totalPenalty.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3 h-3" /> Breakdown
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {dueSummary.itemBreakdown.length === 0 ? (
                    <p className="text-sm text-green-600 font-medium">All principal installments are up to date! ✅</p>
                  ) : (
                    dueSummary.itemBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{item.name}</span>
                          <span className="text-[10px] text-gray-500 font-medium">Due: {new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">৳{item.amount.toLocaleString('en-IN')}</span>
                          <div className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mt-1 bg-opacity-20 inline-block
                            ${item.status === 'OVERDUE' ? 'bg-red-500 text-red-700' : 'bg-orange-500 text-orange-700'}`}>
                            {item.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.25rem] p-12 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Select a shareholder to view their owed balance summary.</p>
          </div>
        )}
      </div>
    </div>
  )
}

