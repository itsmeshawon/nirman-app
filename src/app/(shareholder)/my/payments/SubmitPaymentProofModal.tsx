"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown, Check, Paperclip, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubmitPaymentProofModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  scheduleItems: any[]
  onSuccess: (proof: any) => void
}

export function SubmitPaymentProofModal({
  open,
  onOpenChange,
  projectId,
  scheduleItems,
  onSuccess,
}: SubmitPaymentProofModalProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleItemId, setScheduleItemId] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const actionableItems = scheduleItems.filter(s =>
    ["DUE", "OVERDUE", "UPCOMING", "PARTIALLY_PAID"].includes(s.status)
  )

  const selectedItem = actionableItems.find(s => s.id === scheduleItemId)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit")
      return
    }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }
    if (!file) {
      toast.error("Payment proof attachment is required")
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("amount", amount)
      if (scheduleItemId) fd.append("schedule_item_id", scheduleItemId)
      if (notes) fd.append("notes", notes)

      const res = await fetch(`/api/projects/${projectId}/payment-proofs`, {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Payment proof submitted for approval!")
      onSuccess(data.data)
      handleClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setScheduleItemId("")
    setAmount("")
    setNotes("")
    setFile(null)
    onOpenChange(false)
  }

  const statusLabel: Record<string, string> = {
    DUE: "Due",
    OVERDUE: "Overdue",
    UPCOMING: "Upcoming",
    PARTIALLY_PAID: "Partially Paid",
  }

  const statusColor: Record<string, string> = {
    DUE: "text-tertiary bg-tertiary-container/40",
    OVERDUE: "text-destructive bg-error-container/40",
    UPCOMING: "text-on-surface-variant bg-surface-variant/50",
    PARTIALLY_PAID: "text-orange-700 bg-orange-50",
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-on-surface">Submit Payment Proof</DialogTitle>
          <p className="text-sm text-on-surface-variant mt-1">
            Submit your payment proof for admin review. Your schedule will be updated once approved.
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Payment Item */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-on-surface">
              Payment Item <span className="font-normal text-on-surface-variant">(Optional — select if paying a specific due)</span>
            </Label>
            <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                {selectedItem ? (
                  <span className="font-medium text-on-surface truncate text-left">
                    {selectedItem.milestone?.name || "Installment"} — ৳{parseFloat(selectedItem.amount).toLocaleString("en-IN")} · Due {new Date(selectedItem.due_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-left">Select a payment item...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
                <Command>
                  <CommandList>
                    <CommandEmpty>No actionable items found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => { setScheduleItemId(""); setScheduleOpen(false) }}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="text-on-surface-variant italic">General payment (not linked to a specific item)</span>
                        <Check className={cn("h-4 w-4 text-primary", !scheduleItemId ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                      {actionableItems.map(item => (
                        <CommandItem
                          key={item.id}
                          value={`${item.milestone?.name || "Installment"} ${item.due_date}`}
                          onSelect={() => {
                            setScheduleItemId(item.id)
                            setAmount(String(parseFloat(item.amount)))
                            setScheduleOpen(false)
                          }}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="font-semibold text-on-surface">{item.milestone?.name || "Installment"}</p>
                            <p className="text-xs text-on-surface-variant">
                              ৳{parseFloat(item.amount).toLocaleString("en-IN")} · Due {new Date(item.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${statusColor[item.status] || ""}`}>
                              {statusLabel[item.status] || item.status}
                            </span>
                            <Check className={cn("h-4 w-4 text-primary", scheduleItemId === item.id ? "opacity-100" : "opacity-0")} />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-on-surface">Payment Amount (৳) *</Label>
            <Input
              type="number"
              step="0.01"
              className="h-11 text-lg font-semibold"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-on-surface-variant">Partial payments are accepted.</p>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-on-surface">Proof Attachment *</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary-container bg-primary-container/20">
                <Paperclip className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-on-surface flex-1 truncate">{file.name}</span>
                <p className="text-xs text-on-surface-variant shrink-0">{(file.size / 1024).toFixed(0)} KB</p>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                  className="text-on-surface-variant hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/60 p-6 text-center hover:border-primary hover:bg-primary-container/10 transition-colors"
              >
                <Upload className="w-6 h-6 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface">Click to upload</span>
                <span className="text-xs text-on-surface-variant">PNG, JPG, PDF · Max 10MB</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-on-surface">Notes <span className="font-normal text-on-surface-variant">(Optional)</span></Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. bKash transaction ID, bank transfer reference..."
              className="min-h-[72px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/40">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 px-8">
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
