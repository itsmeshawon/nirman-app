import { useState, useMemo } from "react"
import { mutate } from "swr"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Download, FileText, Pencil, Trash2, Search, Paperclip, Hash, Calendar, CreditCard, FileSymlink, StickyNote } from "lucide-react"
import { toast } from "sonner"

interface AllPaymentsTabProps {
  projectId: string
  payments: any[]
  scheduleItems?: any[]
  milestones?: any[]
  onDelete?: (paymentId: string) => void
  onUpdate?: (payment: any) => void
}

export function AllPaymentsTab({ projectId, payments, scheduleItems = [], milestones = [], onDelete, onUpdate }: AllPaymentsTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterMilestones, setFilterMilestones] = useState<Set<string>>(new Set())
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  const toggleMilestone = (id: string) => {
    setFilterMilestones(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredPayments = useMemo(() => {
    let result = payments

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => {
        const name = p.shareholder?.profiles?.name?.toLowerCase() || ""
        const phone = p.shareholder?.profiles?.phone?.toLowerCase() || ""
        const receipt = p.receipt_no?.toLowerCase() || ""
        return name.includes(q) || phone.includes(q) || receipt.includes(q)
      })
    }

    if (filterMilestones.size > 0) {
      result = result.filter(p => {
        const scheduleItem = scheduleItems.find(si => si.id === p.schedule_item_id)
        const milestoneId = scheduleItem?.milestone?.id ?? "none"
        return filterMilestones.has(milestoneId)
      })
    }

    return result
  }, [payments, scheduleItems, search, filterMilestones])

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
      mutate(`/api/projects/${projectId}/page-data/payments`)
      setEditingPayment(null)
      if (selectedPayment?.id === editingPayment.id) {
        setSelectedPayment((prev: any) => ({ ...prev, amount: editAmount, method: editMethod, reference_no: editRef, notes: editNotes }))
      }
      onUpdate?.(data.payment)
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
      mutate(`/api/projects/${projectId}/page-data/payments`)
      if (selectedPayment?.id === paymentId) setSelectedPayment(null)
      onDelete?.(paymentId)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getMilestoneName = (payment: any) => {
    const scheduleItem = scheduleItems.find(si => si.id === payment.schedule_item_id)
    return scheduleItem?.milestone?.name || "General (Monthly Payment)"
  }

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

  const formatMethod = (method: string) =>
    (method || "").replace(/_/g, " ")

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-3 flex-wrap">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <Input
              placeholder="Search by shareholder, phone, receipt..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Milestone multi-select filter */}
          <div className="relative">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface-variant hover:bg-surface-variant/20 select-none">
                <span>
                  {filterMilestones.size === 0
                    ? "All Milestones"
                    : filterMilestones.size === 1
                      ? (milestones.find(m => filterMilestones.has(m.id))?.name ?? (filterMilestones.has("none") ? "No Milestone" : "1 selected"))
                      : `${filterMilestones.size} milestones`}
                </span>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
              </summary>
              <div className="absolute z-20 mt-1 w-56 bg-surface border border-outline-variant/40 rounded-xl shadow-lg py-1 overflow-hidden">
                <button
                  onClick={() => toggleMilestone("none")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterMilestones.has("none") ? "bg-primary border-primary" : "border-outline-variant"}`}>
                    {filterMilestones.has("none") && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  No Milestone
                </button>
                {milestones.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMilestone(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterMilestones.has(m.id) ? "bg-primary border-primary" : "border-outline-variant"}`}>
                      {filterMilestones.has(m.id) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    {m.name}
                  </button>
                ))}
                {filterMilestones.size > 0 && (
                  <div className="border-t border-outline-variant/30 mt-1 pt-1">
                    <button onClick={() => setFilterMilestones(new Set())} className="w-full px-3 py-1.5 text-xs text-primary hover:bg-primary-container/20 text-left">
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Recorded</TableHead>
              <TableHead>Shareholder</TableHead>
              <TableHead>Payment Type / Milestone</TableHead>
              <TableHead className="text-right">Amount (৳)</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">No payments recorded yet.</TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p) => {
                const milestoneName = getMilestoneName(p)
                return (
                  <TableRow key={p.id} className={selectedPayment?.id === p.id ? "bg-primary-container/20" : ""}>
                    <TableCell className="text-sm text-on-surface-variant">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setSelectedPayment(selectedPayment?.id === p.id ? null : p)}
                        className="text-left group"
                      >
                        <div className="text-sm font-semibold text-primary group-hover:underline underline-offset-2 transition-colors">{p.shareholder?.profiles?.name}</div>
                        <div className="text-xs text-on-surface-variant">{p.shareholder?.profiles?.phone || "—"}</div>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-on-surface-variant">{milestoneName}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)} className="size-8 p-0 text-on-surface-variant hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="size-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAYMENT DETAIL SIDE PANEL — matches Shareholder profile sheet exactly */}
      <Sheet open={!!selectedPayment} onOpenChange={(open) => { if (!open) setSelectedPayment(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          {selectedPayment && (() => {
            const p = selectedPayment
            const name = p.shareholder?.profiles?.name || ""
            const initials = getInitials(name)
            const milestoneName = getMilestoneName(p)

            return (
              <>
                {/* Profile Header */}
                <div className="px-6 pt-8 pb-5 border-b border-outline-variant/40">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary-container/30 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-on-surface leading-tight">{name || "—"}</h2>
                      <p className="text-sm text-on-surface-variant mt-0.5">{p.shareholder?.profiles?.phone || "—"}</p>
                      <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-success-container text-on-success-container border border-success-container">
                        ৳ {parseFloat(p.amount).toLocaleString('en-IN')} Paid
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                  {/* Payment Info */}
                  <section>
                    <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Payment Details</h3>
                    <div className="space-y-3">
                      <DetailRow icon={<Hash className="h-4 w-4 text-on-surface-variant" />} label="Receipt No." value={p.receipt_no} mono />
                      <DetailRow icon={<Calendar className="h-4 w-4 text-on-surface-variant" />} label="Date Recorded" value={new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
                      <DetailRow icon={<FileSymlink className="h-4 w-4 text-on-surface-variant" />} label="Payment Type / Milestone" value={milestoneName} />
                      <DetailRow icon={<CreditCard className="h-4 w-4 text-on-surface-variant" />} label="Method" value={formatMethod(p.method)} />
                      <DetailRow icon={<Hash className="h-4 w-4 text-on-surface-variant" />} label="Reference No." value={p.reference_no} mono />
                      <DetailRow icon={<StickyNote className="h-4 w-4 text-on-surface-variant" />} label="Notes" value={p.notes} />
                    </div>
                  </section>

                  {/* Proof attachment */}
                  {p.proof?.[0]?.attachment_url && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <section>
                        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Proof Attachment</h3>
                        <a
                          href={p.proof[0].attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-outline-variant/40 px-3 py-2.5 hover:bg-surface-variant/20 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-on-surface-variant shrink-0" />
                          <span className="text-sm text-primary font-medium truncate">{p.proof[0].attachment_name || "View Attachment"}</span>
                        </a>
                      </section>
                    </>
                  )}

                  <div className="border-t border-outline-variant/40" />

                  {/* Quick actions */}
                  <div className="space-y-2 pb-2">
                    <button
                      onClick={() => handleDownloadReceipt(p.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
                    >
                      <FileText className="h-4 w-4" /> Download Receipt
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { openEditDialog(p); setSelectedPayment(null) }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-outline-variant/40 text-on-surface hover:bg-surface-variant/20 transition-colors"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-error-container text-on-error-container hover:bg-error-container/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

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

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className={`text-sm text-on-surface font-medium break-words ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  )
}
