import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Download, FileText, Pencil, Trash2, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AllPaymentsTab({ projectId, payments }: { projectId: string, payments: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit Modal State
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editMethod, setEditMethod] = useState("")
  const [editRef, setEditRef] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const handleDownloadReceipt = (paymentId: string) => {
    window.open(`/${projectId}/payments/${paymentId}/receipt`, "_blank")
  }

  const openEditDialog = (payment: any) => {
    setEditingPayment(payment)
    setEditAmount(payment.amount.toString())
    setEditMethod(payment.method)
    setEditRef(payment.reference_no || "")
    setEditNotes(payment.notes || "")
  }

  const handleUpdate = async () => {
    if (!editingPayment) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/payments/${editingPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: editAmount,
          method: editMethod,
          reference_no: editRef,
          notes: editNotes
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success("Payment record updated")
      setEditingPayment(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record? This will also revert the status of any linked installment. This cannot be undone.")) return
    
    try {
      const res = await fetch(`/api/projects/${projectId}/payments/${paymentId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success("Payment deleted successfully")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="overflow-hidden">
       <div className="p-4 border-b bg-surface-variant/30 flex justify-between items-center">
         <h3 className="text-lg font-semibold text-on-surface">Payment Ledger</h3>
         <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
         </Button>
       </div>

       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Recorded</TableHead>
              <TableHead>Receipt #</TableHead>
              <TableHead>Shareholder</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount (৳)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-8 text-on-surface-variant">No payments recorded yet.</TableCell>
               </TableRow>
            ) : (
               payments.map((p) => (
                 <TableRow key={p.id}>
                    <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-on-surface">{p.receipt_no}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-on-surface">{p.shareholder?.profiles?.name}</div>
                      <div className="text-xs text-on-surface-variant">Unit: {p.shareholder?.unit_flat}</div>
                    </TableCell>
                    <TableCell className="text-sm uppercase text-[10px] font-bold text-slate-500">{p.method.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm text-on-surface-variant font-mono text-xs">{p.reference_no || "N/A"}</TableCell>
                    <TableCell className="text-right font-bold text-primary">৳{parseFloat(p.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(p.id)} className="text-on-surface-variant hover:text-primary">
                             <FileText className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(p)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Record
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                    </TableCell>
                 </TableRow>
               ))
            )}
          </TableBody>
       </Table>

       {/* EDIT PAYMENT DIALOG */}
       <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
         <DialogContent className="sm:max-w-[450px]">
           <DialogHeader>
             <DialogTitle>Edit Payment Record</DialogTitle>
             <DialogDescription>Correct errors in a previously recorded transaction.</DialogDescription>
           </DialogHeader>
           <div className="space-y-4 mt-4 text-left">
              <div className="space-y-2">
                 <Label>Amount (৳)</Label>
                 <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Method</Label>
                   <Select value={editMethod} onValueChange={(v) => v && setEditMethod(v)}>
                     <SelectTrigger>
                        <span className="flex-1 text-left truncate capitalize">{editMethod.toLowerCase().replace("_", " ")}</span>
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
                <div className="space-y-2">
                   <Label>Reference No.</Label>
                   <Input value={editRef} onChange={(e) => setEditRef(e.target.value)} placeholder="TXN ID / Check #" />
                </div>
              </div>
              <div className="space-y-2">
                 <Label>Notes</Label>
                 <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal remarks..." />
              </div>
              <DialogFooter className="pt-4">
                 <Button variant="outline" onClick={() => setEditingPayment(null)} disabled={isSubmitting}>Cancel</Button>
                 <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                    {isSubmitting ? "Updating..." : "Save Changes"}
                 </Button>
              </DialogFooter>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  )
}

