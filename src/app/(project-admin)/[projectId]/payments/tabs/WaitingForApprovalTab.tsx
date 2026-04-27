"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, ChevronsUpDown, CheckCircle2, XCircle, Search, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH",          label: "Cash" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "BKASH",         label: "bKash" },
  { value: "NAGAD",         label: "Nagad" },
]

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  PENDING:  { label: "Pending",  style: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", style: "bg-primary-container/50 text-primary" },
  REJECTED: { label: "Rejected", style: "bg-error-container/50 text-destructive" },
}

interface WaitingForApprovalTabProps {
  projectId: string
  proofs: any[]
  onProofApproved: (proofId: string, payment: any) => void
  onProofRejected: (proofId: string) => void
}

export function WaitingForApprovalTab({
  projectId,
  proofs: initialProofs,
  onProofApproved,
  onProofRejected,
}: WaitingForApprovalTabProps) {
  const [proofs, setProofs] = useState(initialProofs)
  const [search, setSearch] = useState("")

  // Approve modal
  const [approveModal, setApproveModal] = useState<{ open: boolean; proof: any | null }>({ open: false, proof: null })
  const [method, setMethod] = useState("BANK_TRANSFER")
  const [methodOpen, setMethodOpen] = useState(false)
  const [referenceNo, setReferenceNo] = useState("")
  const [approveNotes, setApproveNotes] = useState("")
  const [isApproving, setIsApproving] = useState(false)

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; proof: any | null }>({ open: false, proof: null })
  const [rejectionNote, setRejectionNote] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  const filtered = useMemo(() => {
    const nonApproved = proofs.filter(p => p.status !== "APPROVED")
    if (!search.trim()) return nonApproved
    const q = search.toLowerCase()
    return nonApproved.filter(p => {
      const name = p.shareholder?.profiles?.name?.toLowerCase() || ""
      const unit = p.shareholder?.unit_flat?.toLowerCase() || ""
      return name.includes(q) || unit.includes(q)
    })
  }, [proofs, search])


  const handleApproveOpen = (proof: any) => {
    setApproveModal({ open: true, proof })
    setMethod("BANK_TRANSFER")
    setReferenceNo("")
    setApproveNotes("")
  }

  const handleApproveConfirm = async () => {
    if (!approveModal.proof) return
    setIsApproving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/payment-proofs/${approveModal.proof.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, reference_no: referenceNo, notes: approveNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Payment recorded! Receipt: ${data.payment.receipt_no}`)
      setProofs(prev => prev.map(p => p.id === approveModal.proof!.id ? { ...p, status: "APPROVED" } : p))
      onProofApproved(approveModal.proof.id, data.payment)
      setApproveModal({ open: false, proof: null })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsApproving(false)
    }
  }

  const handleRejectOpen = (proof: any) => {
    setRejectModal({ open: true, proof })
    setRejectionNote("")
  }

  const handleRejectConfirm = async () => {
    if (!rejectModal.proof) return
    setIsRejecting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/payment-proofs/${rejectModal.proof.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_note: rejectionNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Proof rejected.")
      setProofs(prev => prev.map(p => p.id === rejectModal.proof!.id ? { ...p, status: "REJECTED", rejection_note: rejectionNote } : p))
      onProofRejected(rejectModal.proof.id)
      setRejectModal({ open: false, proof: null })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsRejecting(false)
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === method)

  return (
    <div className="space-y-4 pt-6">

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <Input
          placeholder="Search shareholder by name or unit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Single table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shareholder</TableHead>
              <TableHead>Amount (৳)</TableHead>
              <TableHead>Linked Item</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rejection Reason</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-on-surface-variant">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-primary opacity-40" />
                    <span>{search ? "No matching proofs found." : "No payment proofs submitted yet."}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.map(proof => {
              const name = proof.shareholder?.profiles?.name || "—"
              const unit = proof.shareholder?.unit_flat || ""
              const statusCfg = STATUS_CONFIG[proof.status] || STATUS_CONFIG.PENDING
              const isPending = proof.status === "PENDING"

              return (
                <TableRow key={proof.id}>
                  <TableCell>
                    <p className="text-sm font-semibold text-on-surface">{name}</p>
                    {unit && <p className="text-xs text-on-surface-variant">Unit {unit}</p>}
                  </TableCell>
                  <TableCell className="font-bold text-on-surface">
                    ৳ {parseFloat(proof.amount).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {proof.schedule_item
                      ? <>{proof.schedule_item.milestone?.name || "Installment"}<br /><span className="text-xs">Due {new Date(proof.schedule_item.due_date).toLocaleDateString()}</span></>
                      : <span className="italic text-xs">General</span>}
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant whitespace-nowrap">
                    {new Date(proof.submitted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <a href={proof.attachment_url} target="_blank" rel="noopener noreferrer" title={proof.attachment_name}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-primary hover:bg-primary-container/20 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${statusCfg.style}`}>
                      {statusCfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[160px]">
                    {proof.rejection_note ? <span>"{proof.rejection_note}"</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isPending && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary-container/20" onClick={() => handleApproveOpen(proof)} title="Record Payment">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-error-container/20" onClick={() => handleRejectOpen(proof)} title="Reject Proof">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Approve modal */}
      <Dialog open={approveModal.open} onOpenChange={open => { if (!open) setApproveModal({ open: false, proof: null }) }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-on-surface">Record Payment</DialogTitle>
            {approveModal.proof && (
              <p className="text-sm text-on-surface-variant mt-1">
                Confirming ৳{parseFloat(approveModal.proof.amount).toLocaleString("en-IN")} for <strong>{approveModal.proof.shareholder?.profiles?.name}</strong>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-on-surface">Payment Method *</Label>
              <Popover open={methodOpen} onOpenChange={setMethodOpen}>
                <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <span className="font-medium text-on-surface">{selectedMethod?.label}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {PAYMENT_METHODS.map(m => (
                          <CommandItem key={m.value} value={m.label} onSelect={() => { setMethod(m.value); setMethodOpen(false) }} className="flex items-center justify-between py-2.5">
                            <span className="font-medium text-on-surface">{m.label}</span>
                            <Check className={cn("h-4 w-4 text-primary", method === m.value ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-on-surface">Reference Number <span className="font-normal text-on-surface-variant">(Optional)</span></Label>
              <Input className="h-11" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Bank ref, bKash ID, check no..." />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-on-surface">Internal Notes <span className="font-normal text-on-surface-variant">(Optional)</span></Label>
              <Textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder="Optional notes for this payment record..." className="min-h-[72px]" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/40">
              <Button variant="outline" onClick={() => setApproveModal({ open: false, proof: null })} disabled={isApproving}>Cancel</Button>
              <Button onClick={handleApproveConfirm} disabled={isApproving} className="bg-primary hover:bg-primary/90 px-8">
                {isApproving ? "Recording..." : "Confirm & Record Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject modal */}
      <Dialog open={rejectModal.open} onOpenChange={open => { if (!open) setRejectModal({ open: false, proof: null }) }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-on-surface">Reject Payment Proof</DialogTitle>
            {rejectModal.proof && (
              <p className="text-sm text-on-surface-variant mt-1">
                Rejecting proof of ৳{parseFloat(rejectModal.proof.amount).toLocaleString("en-IN")} from <strong>{rejectModal.proof.shareholder?.profiles?.name}</strong>. The shareholder will see your reason.
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-on-surface">Rejection Reason *</Label>
              <Textarea
                value={rejectionNote}
                onChange={e => setRejectionNote(e.target.value)}
                placeholder="e.g. Image is blurry, amount does not match, wrong account..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-on-surface-variant">This note will be visible to the shareholder.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/40">
              <Button variant="outline" onClick={() => setRejectModal({ open: false, proof: null })} disabled={isRejecting}>Cancel</Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={isRejecting || !rejectionNote.trim()}
                className="bg-destructive hover:bg-destructive/90 text-white px-8"
              >
                {isRejecting ? "Rejecting..." : "Reject Proof"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
