"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Info, Ban, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH",          label: "Cash" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "BKASH",         label: "bKash" },
  { value: "NAGAD",         label: "Nagad" },
]

/* Reusable trigger button — matches the shareholder combobox style */
function ComboTrigger({ label, placeholder }: { label?: string; placeholder: string; open: boolean }) {
  return (
    <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      {label
        ? <span className="font-medium text-on-surface truncate text-left">{label}</span>
        : <span className="text-muted-foreground text-left">{placeholder}</span>}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </PopoverTrigger>
  )
}

export function RecordPaymentTab({
  projectId,
  scheduleItems,
  shareholders,
  payments,
  onSuccess
}: {
  projectId: string
  scheduleItems: any[]
  shareholders: any[]
  payments: any[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [shareholderOpen, setShareholderOpen] = useState(false)
  const [scheduleOpen,    setScheduleOpen]    = useState(false)
  const [methodOpen,      setMethodOpen]      = useState(false)

  const [shareholderId,  setShareholderId]  = useState("")
  const [scheduleItemId, setScheduleItemId] = useState("")
  const [amount,         setAmount]         = useState("")
  const [method,         setMethod]         = useState("BANK_TRANSFER")
  const [referenceNo,    setReferenceNo]    = useState("")
  const [notes,          setNotes]          = useState("")
  const [waivePenalties, setWaivePenalties] = useState(false)

  const dueSummary = useMemo(() => {
    if (!shareholderId) return null

    const shItems = scheduleItems.filter(item => item.shareholder_id === shareholderId)
    let totalPrincipal = 0
    let totalPenalty   = 0
    const itemBreakdown: any[] = []

    shItems.forEach(item => {
      const paid = payments
        .filter(p => p.schedule_item_id === item.id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

      const leftToPay = (parseFloat(item.amount) || 0) - paid

      if (leftToPay > 0 && ['OVERDUE', 'DUE', 'PARTIALLY_PAID'].includes(item.status)) {
        totalPrincipal += leftToPay
        itemBreakdown.push({
          name:   item.milestone?.name || "Payment Installment",
          date:   item.due_date,
          amount: leftToPay,
          status: item.status,
        })
      }

      if (item.penalties) {
        totalPenalty += item.penalties
          .filter((p: any) => !p.is_waived)
          .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
      }
    })

    return { totalPrincipal, totalPenalty, itemBreakdown }
  }, [shareholderId, scheduleItems, payments])

  const activeSchedules = scheduleItems.filter(item =>
    item.shareholder_id === shareholderId &&
    ['DUE', 'OVERDUE', 'PARTIALLY_PAID'].includes(item.status)
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
          shareholder_id:   shareholderId,
          schedule_item_id: scheduleItemId && scheduleItemId !== "none" ? scheduleItemId : null,
          amount:           parseFloat(amount) || 0,
          method,
          reference_no:     referenceNo,
          notes,
          waive_penalties:  waivePenalties,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Payment recorded! Receipt: ${data.payment.receipt_no}`)
      setAmount(""); setReferenceNo(""); setScheduleItemId("")
      setNotes(""); setWaivePenalties(false); setShareholderId("")
      router.refresh()
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedShareholder = shareholders.find(s => s.id === shareholderId)
  const shName              = selectedShareholder?.profiles?.name
  const shUnit              = selectedShareholder?.unit_flat
  const selectedSchedule    = activeSchedules.find(s => s.id === scheduleItemId)
  const selectedMethod      = PAYMENT_METHODS.find(m => m.value === method)

  const totalDue      = dueSummary ? dueSummary.totalPrincipal + (waivePenalties ? 0 : dueSummary.totalPenalty) : 0
  const amountEntered = parseFloat(amount) || 0
  const remaining     = Math.max(0, totalDue - amountEntered)

  return (
    <div className="space-y-6 py-2">

      {/* ── Shareholder ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-on-surface">Select Shareholder *</Label>
        <Popover open={shareholderOpen} onOpenChange={setShareholderOpen}>
          <ComboTrigger
            open={shareholderOpen}
            placeholder="Search shareholder by name or unit..."
            label={shName ? `${shName} · Unit ${shUnit}` : undefined}
          />
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
            <Command>
              <CommandInput placeholder="Search by name or unit..." />
              <CommandList>
                <CommandEmpty>No shareholder found.</CommandEmpty>
                <CommandGroup>
                  {shareholders.map(s => (
                    <CommandItem
                      key={s.id}
                      value={`${s.profiles?.name} ${s.unit_flat}`}
                      onSelect={() => { setShareholderId(s.id); setScheduleItemId(""); setShareholderOpen(false) }}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">{s.profiles?.name}</p>
                        <p className="text-xs text-on-surface-variant">Unit: {s.unit_flat}</p>
                      </div>
                      <Check className={cn("h-4 w-4 text-primary", shareholderId === s.id ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Balance summary ── */}
      {dueSummary && (
        <div className="rounded-xl border border-outline-variant/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-3 divide-x divide-outline-variant/40 bg-surface-variant/30">
            <div className="p-4 text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Principal Due</p>
              <p className="text-lg font-black text-on-surface">৳{dueSummary.totalPrincipal.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Penalties</p>
              <p className={`text-lg font-black ${waivePenalties ? 'text-outline-variant line-through' : 'text-destructive'}`}>
                ৳{dueSummary.totalPenalty.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 text-center bg-on-surface/5">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Owed</p>
              <p className="text-lg font-black text-on-surface">৳{totalDue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {amountEntered > 0 && (
            <div className="flex items-center justify-between px-6 py-3 bg-primary-container/30 border-t border-primary-container/50">
              <div>
                <p className="text-[10px] font-bold text-on-primary-container uppercase tracking-widest">Paying Now</p>
                <p className="text-xl font-black text-primary">৳{amountEntered.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">After Payment</p>
                <p className={`text-xl font-black ${remaining === 0 ? 'text-primary' : 'text-on-surface'}`}>
                  {remaining === 0 ? "✓ Settled" : `৳${remaining.toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>
          )}

          {dueSummary.itemBreakdown.length > 0 && (
            <div className="p-4 border-t border-outline-variant/40 space-y-2">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Overdue Installments
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {dueSummary.itemBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-surface border border-outline-variant/30">
                    <div>
                      <span className="font-semibold text-on-surface">{item.name}</span>
                      <span className="text-on-surface-variant ml-2 text-xs">Due {new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">৳{item.amount.toLocaleString('en-IN')}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${item.status === 'OVERDUE' ? 'bg-error-container/50 text-destructive' : 'bg-orange-100 text-orange-700'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dueSummary.itemBreakdown.length === 0 && (
            <div className="px-4 py-3 border-t border-outline-variant/40">
              <p className="text-sm text-primary font-medium">All installments are up to date.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Link to Expected Schedule — full width ── */}
      {shareholderId && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-on-surface">Link to Expected Schedule <span className="font-normal text-on-surface-variant">(Optional)</span></Label>
          <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <ComboTrigger
              open={scheduleOpen}
              placeholder="Manual Ad-hoc Payment (Unlinked)"
              label={selectedSchedule
                ? `${selectedSchedule.milestone?.name || "Installment"} — ৳${parseFloat(selectedSchedule.amount).toLocaleString('en-IN')} · Due ${new Date(selectedSchedule.due_date).toLocaleDateString()}`
                : undefined}
            />
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="none"
                      onSelect={() => { setScheduleItemId("none"); setScheduleOpen(false) }}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="text-on-surface-variant italic">Manual Ad-hoc Payment (Unlinked)</span>
                      <Check className={cn("h-4 w-4 text-primary", !scheduleItemId || scheduleItemId === "none" ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                    {activeSchedules.map(sch => (
                      <CommandItem
                        key={sch.id}
                        value={`${sch.milestone?.name || "Installment"} ${sch.due_date}`}
                        onSelect={() => { setScheduleItemId(sch.id); setScheduleOpen(false) }}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="font-semibold text-on-surface">{sch.milestone?.name || "Installment"}</p>
                          <p className="text-xs text-on-surface-variant">৳{parseFloat(sch.amount).toLocaleString('en-IN')} · Due {new Date(sch.due_date).toLocaleDateString()}</p>
                        </div>
                        <Check className={cn("h-4 w-4 text-primary", scheduleItemId === sch.id ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* ── Amount + Payment Method ── */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2 w-44 shrink-0">
          <Label className="text-sm font-semibold text-on-surface">Amount (৳) *</Label>
          <Input className="h-11 text-lg font-semibold" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-2 flex-1">
          <Label className="text-sm font-semibold text-on-surface">Payment Method *</Label>
          <Popover open={methodOpen} onOpenChange={setMethodOpen}>
            <ComboTrigger
              open={methodOpen}
              placeholder="Select method..."
              label={selectedMethod?.label}
            />
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {PAYMENT_METHODS.map(m => (
                      <CommandItem
                        key={m.value}
                        value={m.label}
                        onSelect={() => { setMethod(m.value); setMethodOpen(false) }}
                        className="flex items-center justify-between py-2.5"
                      >
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
      </div>

      {/* ── Reference ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-on-surface">Reference Number / Check No.</Label>
        <Input className="h-11" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. Bank Ref #, bKash ID, Check Digit" />
      </div>

      {/* ── Notes ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-on-surface">Internal Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note for physical receipt location or specific instructions..." className="min-h-[80px]" />
      </div>

      {/* ── Waive penalties ── */}
      {dueSummary && dueSummary.totalPenalty > 0 && (
        <div className="flex items-center space-x-3 p-4 bg-error-container/30 border border-error-container rounded-xl">
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
            <p className="text-xs text-destructive">Removes ৳{dueSummary.totalPenalty.toLocaleString('en-IN')} in late fees for this shareholder.</p>
          </div>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="pt-2 border-t border-outline-variant/40 flex justify-end">
        <Button onClick={handleCreate} disabled={isSubmitting} className="h-11 px-8 bg-primary hover:bg-primary/90">
          {isSubmitting ? "Recording..." : "Confirm & Record Payment"}
        </Button>
      </div>

    </div>
  )
}
