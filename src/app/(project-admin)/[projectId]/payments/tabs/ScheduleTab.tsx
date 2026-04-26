import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar as CalendarIcon, Pencil, Trash2, MoreVertical, ChevronsUpDown, Check } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const SCHEDULE_STATUSES = [
  { value: "UPCOMING",      label: "Upcoming" },
  { value: "DUE",           label: "Due" },
  { value: "OVERDUE",       label: "Overdue" },
  { value: "PARTIALLY_PAID",label: "Partially Paid" },
  { value: "PAID",          label: "Paid" },
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

export function ScheduleTab({ projectId, scheduleItems, payments, milestones, shareholders, createOpen, onCreateOpenChange }: { projectId: string, scheduleItems: any[], payments: any[], milestones: any[], shareholders: any[], createOpen?: boolean, onCreateOpenChange?: (open: boolean) => void }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState("")
  const [filterOpen,   setFilterOpen]   = useState(false)

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
  const [editStatus,      setEditStatus]      = useState("")
  const [editMilestoneId, setEditMilestoneId] = useState("")
  const [editMilestoneOpen, setEditMilestoneOpen] = useState(false)
  const [editStatusOpen,    setEditStatusOpen]    = useState(false)

  // Create form state
  const [shareholderId, setShareholderId] = useState("")
  const [milestoneId,   setMilestoneId]   = useState("")
  const [amount,        setAmount]        = useState("")
  const [dueDate,       setDueDate]       = useState("")

  const getPaidAmount = (scheduleId: string) =>
    payments.filter(p => p.schedule_item_id === scheduleId)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const getPenalty = (item: any) => {
    if (!item.penalties) return 0
    return item.penalties
      .filter((p: any) => !p.is_waived)
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const handleCreate = async () => {
    if (!shareholderId || !amount || !dueDate) {
      toast.error("Please fill in shareholder, amount, and due date.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareholder_id: shareholderId,
          milestone_id:   milestoneId || null,
          amount,
          due_date:       dueDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Schedule collection created successfully!")
      setIsModalOpen(false)
      setShareholderId(""); setMilestoneId(""); setAmount(""); setDueDate("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item)
    setEditAmount(item.amount.toString())
    setEditDate(new Date(item.due_date).toISOString().split('T')[0])
    setEditStatus(item.status)
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
          status:       editStatus,
          milestone_id: editMilestoneId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Installment updated successfully")
      setEditingItem(null)
      router.refresh()
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
      router.refresh()
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

  const filteredItems = filterStatus
    ? scheduleItems.filter(item => item.status === filterStatus)
    : scheduleItems

  // Derived labels
  const selectedShareholder = shareholders.find(s => s.id === shareholderId)
  const selectedMilestone   = milestones.find(m => m.id === milestoneId)
  const editMilestone       = milestones.find(m => m.id === editMilestoneId)
  const editStatusLabel     = SCHEDULE_STATUSES.find(s => s.value === editStatus)?.label

  const filterLabel = SCHEDULE_STATUSES.find(s => s.value === filterStatus)?.label

  return (
    <div>
      <div className="pt-1 pb-3 w-48">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Shareholder</TableHead>
            <TableHead>Milestone</TableHead>
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
                  <TableCell className="text-sm text-on-surface-variant">{item.milestone?.name || 'General'}</TableCell>
                  <TableCell className="text-right font-medium text-on-surface">{parseFloat(item.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-sm text-primary font-semibold">{getPaidAmount(item.id).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{getPenalty(item).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${uiStyle}`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Installment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

            {/* Shareholder — searchable combobox */}
            <div className="space-y-2">
              <Label>Shareholder *</Label>
              <ComboBox
                open={shareholderOpen}
                onOpenChange={setShareholderOpen}
                placeholder="Search shareholder by name or unit..."
                label={selectedShareholder ? `${selectedShareholder.profiles?.name} · Unit ${selectedShareholder.unit_flat}` : undefined}
              >
                <CommandInput placeholder="Search by name or unit..." />
                <CommandList>
                  <CommandEmpty>No shareholder found.</CommandEmpty>
                  <CommandGroup>
                    {shareholders.map(s => (
                      <CommandItem
                        key={s.id}
                        value={`${s.profiles?.name} ${s.unit_flat}`}
                        onSelect={() => { setShareholderId(s.id); setShareholderOpen(false) }}
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
              </ComboBox>
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

            {/* Status */}
            <div className="space-y-2">
              <Label>Status Override</Label>
              <ComboBox
                open={editStatusOpen}
                onOpenChange={setEditStatusOpen}
                placeholder="Select status..."
                label={editStatusLabel}
              >
                <CommandList>
                  <CommandGroup>
                    {SCHEDULE_STATUSES.map(s => (
                      <CommandItem
                        key={s.value}
                        value={s.label}
                        onSelect={() => { setEditStatus(s.value); setEditStatusOpen(false) }}
                        className="flex items-center justify-between py-2.5"
                      >
                        <span className="font-medium text-on-surface">{s.label}</span>
                        <Check className={cn("h-4 w-4 text-primary", editStatus === s.value ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </ComboBox>
              <p className="text-[10px] text-on-surface-variant italic">Note: Manually overriding status might be reverted by the payment engine if it detects conflicting records.</p>
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
    </div>
  )
}
