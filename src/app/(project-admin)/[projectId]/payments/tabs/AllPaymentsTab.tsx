import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Download, FileText, Pencil, Trash2, MoreVertical, Search, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AllPaymentsTab({ projectId, payments }: { projectId: string, payments: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments
    const q = search.toLowerCase()
    return payments.filter(p => {
      const name = p.shareholder?.profiles?.name?.toLowerCase() || ""
      const unit = p.shareholder?.unit_flat?.toLowerCase() || ""
      const receipt = p.receipt_no?.toLowerCase() || ""
      return name.includes(q) || unit.includes(q) || receipt.includes(q)
    })
  }, [payments, search])

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
    <div>
       <div className="flex items-center justify-between gap-3 pb-3">
         <div className="relative w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
           <Input
             placeholder="Search by shareholder, unit, receipt..."
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="pl-9 h-10"
           />
         </div>
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
              <TableHead>Proof</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="text-center py-8 text-on-surface-variant">No payments recorded yet.</TableCell>
               </TableRow>
            ) : (
               filteredPayments.map((p) => (
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
                    <TableCell>
                      {p.proof?.[0]?.attachment_url
                        ? <a href={p.proof[0].attachment_url} target="_blank" rel="noopener noreferrer" title={p.proof[0].attachment_name}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-primary hover:bg-primary-container/20 transition-colors">
                            <Paperclip className="w-4 h-4" />
                          </a>
                        : <span className="text-xs text-on-surface-variant">—</span>}
                    </TableCell>
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

