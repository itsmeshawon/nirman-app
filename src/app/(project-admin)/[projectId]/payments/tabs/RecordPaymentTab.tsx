import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Download } from "lucide-react"

export function RecordPaymentTab({ projectId, scheduleItems, shareholders }: { projectId: string, scheduleItems: any[], shareholders: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [shareholderId, setShareholderId] = useState("")
  const [scheduleItemId, setScheduleItemId] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("BANK_TRANSFER")
  const [referenceNo, setReferenceNo] = useState("")
  const [notes, setNotes] = useState("")

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
           schedule_item_id: scheduleItemId || null,
           amount,
           method,
           reference_no: referenceNo,
           notes
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
       
       router.refresh()
    } catch (err: any) {
       toast.error(err.message)
    } finally {
       setIsSubmitting(false)
    }
  }

  // Override shadcn Select trigger layout bugs natively by fetching name:
  const shName = shareholders.find(s => s.id === shareholderId)?.profiles?.name
  const methodName = method.replace("_", " ")

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Record New Payment</h2>

      <div className="space-y-6">
         <div className="space-y-2">
            <Label>Select Shareholder *</Label>
            <Select value={shareholderId} onValueChange={setShareholderId}>
               <SelectTrigger>
                  <span className="flex-1 text-left truncate">
                    {shName ? shName : <span className="text-muted-foreground">Select a shareholder</span>}
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
            <div className="space-y-2 p-4 bg-gray-50 border rounded-lg">
               <Label className="text-gray-700">Link to Expected Schedule (Optional)</Label>
               <Select value={scheduleItemId} onValueChange={setScheduleItemId}>
                 <SelectTrigger>
                   <span className="flex-1 text-left truncate">
                      {scheduleItemId ? `Schedule Link Active` : <span className="text-muted-foreground">Manual Ad-hoc Payment</span>}
                   </span>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Manual Ad-hoc Payment</SelectItem>
                   {activeSchedules.map(sch => (
                      <SelectItem key={sch.id} value={sch.id}>
                         Due {new Date(sch.due_date).toLocaleDateString()} — ৳{sch.amount} [ {sch.status} ]
                      </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {activeSchedules.length > 0 && <p className="text-xs text-orange-600 mt-1">This user has {activeSchedules.length} pending obligations.</p>}
            </div>
         )}

         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Amount (৳) *</Label>
               <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
               <Label>Method *</Label>
               <Select value={method} onValueChange={setMethod}>
                 <SelectTrigger>
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
            <Label>Transaction / Reference Number</Label>
            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. TRXR123999 / Check No." />
         </div>

         <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context..." />
         </div>

         <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleCreate} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
               {isSubmitting ? "Processing..." : "Confirm & Record Payment"}
            </Button>
         </div>
      </div>
    </div>
  )
}
