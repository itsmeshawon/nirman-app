import { useState, useEffect } from "react"
import { mutate } from "swr"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar as CalendarIcon, Pencil, Trash2, ChevronsUpDown, Check, Banknote, Ban } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const SCHEDULE_STATUSES = [
  { value: "UPCOMING",      label: "Upcoming" },
  { value: "DUE",           label: "Due" },
  { value: "OVERDUE",       label: "Overdue" },
  { value: "PARTIALLY_PAID",label: "Partially Paid" },
  { value: "PAID",          label: "Paid" },
]

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH",          label: "Cash" },
  { value: "CHEQUE",        label: "Cheque" },
  { value: "BKASH",         label: "bKash" },
  { value: "NAGAD",         label: "Nagad" },
]

function ComboBox({
  open, onOpenChange, label, placeholder, children
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  label?: string
  placeholder: string
  children: React.ReactNode
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        {label
          ? <span className="font-medium text-on-surface truncate text-left">{label}</span>
          : <span className="text-muted-foreground text-left">{placeholder}</span>}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
        <Command>
          {children}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ScheduleTab({ projectId, scheduleItems, payments, milestones, shareholders, createOpen, onCreateOpenChange, onPaymentRecorded }: { projectId: string, scheduleItems: any[], payments: any[], milestones: any[], shareholders: any[], createOpen?: boolean, onCreateOpenChange?: (open: boolean) => void, onPaymentRecorded?: (payment: any) => void }) {
  const [filterStatus, setFilterStatus] = useState("")
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [localPayments, setLocalPayments] = useState(payments)
  const [localScheduleItems, setLocalScheduleItems] = useState(scheduleItems)

  useEffect(() => { setLocalPayments(payments) }, [payments])
  useEffect(() => { setLocalScheduleItems(scheduleItems) }, [scheduleItems])

  // Create modal — controlled externally if props provided, else local fallback
  const [_localModalOpen, _setLocalModalOpen] = useState(false)
  const isModalOpen = createOpen ?? _localModalOpen
  const setIsModalOpen = onCreateOpenChange ?? _setLocalModalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareholderOpen, setShareholderOpen] = useState(false)
  const [milestoneOpen,   setMilestoneOpen]   = useState(false)

  // Edit modal state
  const [editingItem,     setEditingItem]     = useState<any>(null)
  const [editAmount,      setEditAmount]      = useState("")
  const [editDate,        setEditDate]        = useState("")
  const [editMilestoneId, setEditMilestoneId] = useState("")
  const [editMilestoneOpen, setEditMilestoneOpen] = useState(false)

  // Create form state
  const [selectedShareholderIds, setSelectedShareholderIds] = useState<string[]>([])
  const [milestoneId,   setMilestoneId]   = useState("")
  const [amount,        setAmount]        = useState("")
  const [dueDate,       setDueDate]       = useState("")

  // Record payment dialog state
  const [payDialogItem, setPayDialogItem] = useState<any>(null)
  const [payAmount,     setPayAmount]     = useState("")
  const [payMethod,     setPayMethod]     = useState("BANK_TRANSFER")
  const [payReference,  setPayReference]  = useState("")
  const [payNotes,      setPayNotes]      = useState("")
  const [payMethodOpen, setPayMethodOpen] = useState(false)
  const [waivePenalties, setWaivePenalties] = useState(false)

  const openPayDialog = (item: any) => {
    const paid = localPayments
      .filter(p => p.schedule_item_id === item.id)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const leftToPay = Math.max(0, (parseFloat(item.amount) || 0) - paid)
    setPayDialogItem(item)
    setPayAmount(leftToPay > 0 ? leftToPay.toString() : "")
    setPayMethod("BANK_TRANSFER")
    setPayReference("")
    setPayNotes("")
    setWaivePenalties(false)
  }

  const handleRecordPayment = async () => {
    if (!payDialogItem || !payAmount || !payMethod) {
      toast.error("Please fill in amount and payment method.")
      return
    }

    const capturedItem = payDialogItem
    const paid = parseFloat(payAmount) || 0
    const tempId = `temp-${Date.now()}`

    const payload = {
      shareholder_id:   capturedItem.shareholder_id,
      schedule_item_id: capturedItem.id,
      amount:           paid,
      method:           payMethod,
      reference_no:     payReference || null,
      notes:            payNotes || null,
      waive_penalties:  waivePenalties,
    }

    // Calculate optimistic status
    const alreadyPaid = localPayments
      .filter(p => p.schedule_item_id === capturedItem.id)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const totalPaid = alreadyPaid + paid
    const optimisticStatus = totalPaid >= parseFloat(capturedItem.amount) ? "PAID" : "PARTIALLY_PAID"

    // Update UI immediately
    setLocalPayments(prev => [...prev, { id: tempId, schedule_item_id: capturedItem.id, amount: paid }])
    setLocalScheduleItems(prev => prev.map(si =>
      si.id === capturedItem.id ? { ...si, status: optimisticStatus } : si
    ))
    setPayDialogItem(null)

    // Finish in background
    try {
      const res = await fetch(`/api/projects/${projectId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setLocalPayments(prev => prev.map(p => p.id === tempId ? data.payment : p))
      onPaymentRecorded?.(data.payment)
      toast.success(`Payment recorded! Receipt: ${data.payment.receipt_no}`)
      mutate(`/api/projects/${projectId}/page-data/payments`)
    } catch (err: any) {
      // Roll back
      setLocalPayments(prev => prev.filter(p => p.id !== tempId))
      setLocalScheduleItems(prev => prev.map(si =>
        si.id === capturedItem.id ? { ...si, status: capturedItem.status } : si
      ))
      toast.error(err.message)
    }
  }

  const getPaidAmount = (scheduleId: string) =>
    localPayments.filter(p => p.schedule_item_id === scheduleId)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const getPenalty = (item: any) => {
    if (!item?.penalties) return 0
    return item.penalties
      .filter((p: any) => !p.is_waived)
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const handleCreate = async () => {
    if (selectedShareholderIds.length === 0 || !amount || !dueDate) {
      toast.error("Please select at least one shareholder, amount, and due date.")
      return
    }

    const dueDateObj = new Date(dueDate)
    const daysDiff = (dueDateObj.getTime() - Date.now()) / (1000 * 3600 * 24)
    const optimisticStatus = daysDiff < 0 ? "OVERDUE" : daysDiff <= 7 ? "DUE" : "UPCOMING"
    const resolvedMilestoneId = milestoneId && milestoneId !== "none" ? milestoneId : null

    // Build one optimistic row per selected shareholder
    const tempIds = selectedShareholderIds.map((_, i) => `temp-${Date.now()}-${i}`)
    const optimisticItems = selectedShareholderIds.map((sid, i) => ({
      id: tempIds[i],
      shareholder_id: sid,
      milestone_id: resolvedMilestoneId,
      amount: parseFloat(amount),
      due_date: dueDateObj.toISOString(),
      status: optimisticStatus,
      shareholder: shareholders.find(s => s.id === sid),
      milestone: milestones.find(m => m.id === milestoneId) || null,
      penalties: [],
    }))

    setLocalScheduleItems(prev => [...prev, ...optimisticItems])
    setIsModalOpen(false)
    setSelectedShareholderIds([]); setMilestoneId(""); setAmount(""); setDueDate("")

    // Fire one API call per shareholder in parallel
    await Promise.all(selectedShareholderIds.map(async (sid, i) => {
      const tempId = tempIds[i]
      try {
        const res = await fetch(`/api/projects/${projectId}/schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shareholder_id: sid,
            milestone_id: resolvedMilestoneId,
            amount,
            due_date: dueDate,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setLocalScheduleItems(prev => prev.map(si => si.id === tempId ? data.scheduleItem : si))
      } catch (err: any) {
        setLocalScheduleItems(prev => prev.filter(si => si.id !== tempId))
        toast.error(err.message)
      }
    }))

    toast.success(`${selectedShareholderIds.length} collection item${selectedShareholderIds.length > 1 ? "s" : ""} created!`)
    mutate(`/api/projects/${projectId}/page-data/payments`)
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item)
    setEditAmount(item.amount.toString())
    setEditDate(new Date(item.due_date).toISOString().split('T')[0])
    setEditMilestoneId(item.milestone_id || "none")
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:       editAmount,
          due_date:     editDate,
          milestone_id: editMilestoneId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Installment updated successfully")
      mutate(`/api/projects/${projectId}/page-data/payments`)
      setEditingItem(null)
      setLocalScheduleItems(prev => prev.map(si => si.id === editingItem.id ? { ...si, ...data.item } : si))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this installment requirement? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules/${itemId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Installment deleted")
      mutate(`/api/projects/${projectId}/page-data/payments`)
      setLocalScheduleItems(prev => prev.filter(si => si.id !== itemId))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const statusConfig: Record<string, string> = {
    UPCOMING:      "bg-surface-variant/50 text-on-surface",
    DUE:           "bg-tertiary-container/50 text-tertiary",
    OVERDUE:       "bg-error-container/50 text-destructive",
    PAID:          "bg-primary-container/50 text-primary",
    PARTIALLY_PAID:"bg-tertiary-container/40 text-on-tertiary-container",
  }

  const [searchShareholder, setSearchShareholder] = useState("")

  const filteredItems = localScheduleItems.filter(item => {
    const matchStatus = !filterStatus || item.status === filterStatus
    const q = searchShareholder.toLowerCase()
    const name = item.shareholder?.profiles?.name?.toLowerCase() || ""
    const unit = item.shareholder?.unit_flat?.toLowerCase() || ""
    const matchSearch = !q || name.includes(q) || unit.includes(q)
    return matchStatus && matchSearch
  })

  // Derived labels
  const selectedMilestone = milestones.find(m => m.id === milestoneId)
  const shareholderLabel = selectedShareholderIds.length === 0
    ? undefined
    : selectedShareholderIds.length === 1
      ? (() => { const s = shareholders.find(x => x.id === selectedShareholderIds[0]); return s ? `${s.profiles?.name} · Unit ${s.unit_flat}` : undefined })()
      : `${selectedShareholderIds.length} shareholders selected`
  const editMilestone       = milestones.find(m => m.id === editMilestoneId)

  const filterLabel = SCHEDULE_STATUSES.find(s => s.value === filterStatus)?.label

  return (
    <div>
      <div className="pt-1 pb-3 flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input
            placeholder="Search shareholder..."
            value={searchShareholder}
            onChange={e => setSearchShareholder(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="w-48">
        <ComboBox
          open={filterOpen}
          onOpenChange={setFilterOpen}
          placeholder="All Statuses"
          label={filterLabel}
        >
          <CommandList>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => { setFilterStatus(""); setFilterOpen(false) }}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-on-surface-variant">All Statuses</span>
                <Check className={cn("h-4 w-4 text-primary", !filterStatus ? "opacity-100" : "opacity-0")} />
              </CommandItem>
              {SCHEDULE_STATUSES.map(s => (
                <CommandItem
                  key={s.value}
                  value={s.label}
                  onSelect={() => { setFilterStatus(s.value); setFilterOpen(false) }}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="font-medium text-on-surface">{s.label}</span>
                  <Check className={cn("h-4 w-4 text-primary", filterStatus === s.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </ComboBox>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Shareholder</TableHead>
            <TableHead>Payment Type / Milestone</TableHead>
            <TableHead className="text-right">Expected (৳)</TableHead>
            <TableHead className="text-right">Paid (৳)</TableHead>
            <TableHead className="text-right text-destructive">Penalty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="p-0 border-0">
                <EmptyState
                  icon={CalendarIcon}
                  title="No payment schedules yet"
                  description="Create payment obligations for shareholders based on milestones or custom dates."
                  actionLabel="Add Collection"
                  onAction={() => setIsModalOpen(true)}
                  className="border-0 rounded-none shadow-none"
                />
              </TableCell>
            </TableRow>
          ) : (
            filteredItems.map(item => {
              const uiStyle = statusConfig[item.status] || statusConfig.UPCOMING
              return (
                <TableRow key={item.id} className={item.status === 'OVERDUE' ? "border-l-4 border-l-red-500" : ""}>
                  <TableCell className="text-sm font-medium">{new Date(item.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-on-surface">{item.shareholder?.profiles?.name}</div>
                    <div className="text-xs text-on-surface-variant">Unit: {item.shareholder?.unit_flat}</div>
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">{item.milestone?.name || 'General (Monthly Payment)'}</TableCell>
                  <TableCell className="text-right font-medium text-on-surface">{parseFloat(item.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-sm text-primary font-semibold">{getPaidAmount(item.id).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{getPenalty(item).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${uiStyle}`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status !== 'PAID' && (
                        <Button variant="ghost" size="sm" onClick={() => openPayDialog(item)} className="size-8 p-0 text-primary hover:text-primary">
                          <Banknote className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} className="size-8 p-0 text-on-surface-variant hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="size-8 p-0 text-destructive hover:text-destructive">
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

      {/* ── CREATE DIALOG ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Collection Requirement</DialogTitle>
            <DialogDescription>Assign a custom payment obligation to a shareholder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">

            {/* Shareholder — multi-select combobox */}
            <div className="space-y-2">
              <Label>Shareholder * <span className="font-normal text-on-surface-variant">(select one or more)</span></Label>
              <ComboBox
                open={shareholderOpen}
                onOpenChange={setShareholderOpen}
                placeholder="Search shareholder by name or unit..."
                label={shareholderLabel}
              >
                <CommandInput placeholder="Search by name or unit..." />
                <CommandList>
                  <CommandEmpty>No shareholder found.</CommandEmpty>
                  <CommandGroup>
                    {shareholders.map(s => {
                      const checked = selectedShareholderIds.includes(s.id)
                      return (
                        <CommandItem
                          key={s.id}
                          value={`${s.profiles?.name} ${s.unit_flat}`}
                          onSelect={() => {
                            setSelectedShareholderIds(prev =>
                              checked ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            )
                            // keep popover open for multi-select
                          }}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="font-semibold text-on-surface">{s.profiles?.name}</p>
                            <p className="text-xs text-on-surface-variant">Unit: {s.unit_flat || "—"}</p>
                          </div>
                          <Check className={cn("h-4 w-4 text-primary", checked ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </ComboBox>
              {selectedShareholderIds.length > 0 && (
                <p className="text-xs text-primary font-medium">{selectedShareholderIds.length} shareholder{selectedShareholderIds.length > 1 ? "s" : ""} selected</p>
              )}
            </div>

            {/* Milestone */}
            <div className="space-y-2">
              <Label>Target Milestone <span className="font-normal text-on-surface-variant">(Optional)</span></Label>
              <ComboBox
                open={milestoneOpen}
                onOpenChange={setMilestoneOpen}
                placeholder="General / Non-milestone"
                label={selectedMilestone?.name}
              >
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="none"
                      onSelect={() => { setMilestoneId("none"); setMilestoneOpen(false) }}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="text-on-surface-variant italic">General / Non-milestone</span>
                      <Check className={cn("h-4 w-4 text-primary", !milestoneId || milestoneId === "none" ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                    {milestones.map(m => (
                      <CommandItem
                        key={m.id}
                        value={m.name}
                        onSelect={() => { setMilestoneId(m.id); setMilestoneOpen(false) }}
                        className="flex items-center justify-between py-2.5"
                      >
                        <span className="font-medium text-on-surface">{m.name}</span>
                        <Check className={cn("h-4 w-4 text-primary", milestoneId === m.id ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </ComboBox>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Amount (৳) *</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? "Creating..." : "Schedule Collection"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Installment</DialogTitle>
            <DialogDescription>Update the details for this payment requirement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Amount (৳)</Label>
                <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
            </div>

            {/* Milestone */}
            <div className="space-y-2">
              <Label>Milestone</Label>
              <ComboBox
                open={editMilestoneOpen}
                onOpenChange={setEditMilestoneOpen}
                placeholder="General"
                label={editMilestone?.name}
              >
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="none"
                      onSelect={() => { setEditMilestoneId("none"); setEditMilestoneOpen(false) }}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="text-on-surface-variant italic">General</span>
                      <Check className={cn("h-4 w-4 text-primary", !editMilestoneId || editMilestoneId === "none" ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                    {milestones.map(m => (
                      <CommandItem
                        key={m.id}
                        value={m.name}
                        onSelect={() => { setEditMilestoneId(m.id); setEditMilestoneOpen(false) }}
                        className="flex items-center justify-between py-2.5"
                      >
                        <span className="font-medium text-on-surface">{m.name}</span>
                        <Check className={cn("h-4 w-4 text-primary", editMilestoneId === m.id ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </ComboBox>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── RECORD PAYMENT DIALOG ── */}
      <Dialog open={!!payDialogItem} onOpenChange={(open) => !open && setPayDialogItem(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {payDialogItem?.shareholder?.profiles?.name} · Unit {payDialogItem?.shareholder?.unit_flat}
              {payDialogItem?.milestone?.name ? ` · ${payDialogItem.milestone.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-outline-variant/40 bg-surface-variant/30">
                <div className="p-3 text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Expected</p>
                  <p className="text-base font-black text-on-surface">৳{parseFloat(payDialogItem?.amount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Paid</p>
                  <p className="text-base font-black text-primary">৳{localPayments
                    .filter(p => p.schedule_item_id === payDialogItem?.id)
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                    .toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 text-center bg-on-surface/5">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Remaining</p>
                  <p className="text-base font-black text-on-surface">৳{Math.max(0,
                    (parseFloat(payDialogItem?.amount || 0) -
                      localPayments
                        .filter(p => p.schedule_item_id === payDialogItem?.id)
                        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))
                  ).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {getPenalty(payDialogItem) > 0 && (
              <div className="flex items-center space-x-3 p-4 bg-error-container/30 border border-error-container rounded-xl">
                <Checkbox
                  id="waive-inline"
                  checked={waivePenalties}
                  onCheckedChange={(checked) => setWaivePenalties(!!checked)}
                  className="w-5 h-5 border-red-300 data-[state=checked]:bg-red-600"
                />
                <div className="grid gap-0.5 leading-none">
                  <label htmlFor="waive-inline" className="text-sm font-bold text-red-900 cursor-pointer flex items-center gap-1.5 uppercase tracking-tight">
                    <Ban className="w-4 h-4" /> Waive Penalty on This Item
                  </label>
                  <p className="text-xs text-destructive">Removes ৳{getPenalty(payDialogItem).toLocaleString('en-IN')} in late fees for this installment.</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 items-end">
              <div className="space-y-2 w-44 shrink-0">
                <Label className="text-sm font-semibold text-on-surface">Amount (৳) *</Label>
                <Input className="h-11 text-lg font-semibold" type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-sm font-semibold text-on-surface">Payment Method *</Label>
                <Popover open={payMethodOpen} onOpenChange={setPayMethodOpen}>
                  <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {PAYMENT_METHODS.find(m => m.value === payMethod)?.label
                      ? <span className="font-medium text-on-surface truncate text-left">{PAYMENT_METHODS.find(m => m.value === payMethod)?.label}</span>
                      : <span className="text-muted-foreground text-left">Select method...</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 ring-0 shadow-none border-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {PAYMENT_METHODS.map(m => (
                            <CommandItem
                              key={m.value}
                              value={m.label}
                              onSelect={() => { setPayMethod(m.value); setPayMethodOpen(false) }}
                              className="flex items-center justify-between py-2.5"
                            >
                              <span className="font-medium text-on-surface">{m.label}</span>
                              <Check className={cn("h-4 w-4 text-primary", payMethod === m.value ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-on-surface">Reference Number / Check No.</Label>
              <Input className="h-11" value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder="e.g. Bank Ref #, bKash ID, Check Digit" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-on-surface">Internal Notes</Label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Note for physical receipt location or specific instructions..." className="min-h-[80px]" />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setPayDialogItem(null)}>Cancel</Button>
              <Button onClick={handleRecordPayment} className="h-11 px-8 bg-primary hover:bg-primary/90">
                Confirm & Record Payment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
