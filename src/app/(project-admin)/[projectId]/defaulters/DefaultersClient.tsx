"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Settings2, Mail, ShieldOff, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface DefaultersClientProps {
  projectId: string
  overdueItems: any[]
  payments: any[]
}

interface PenaltyRow {
  id: string
  amount: number
  calculated_at: string
  schedule_item_id: string
  due_date: string
  installment_amount: number
  milestone_name: string | null
}

export function DefaultersClient({ projectId, overdueItems, payments }: DefaultersClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false)
  const [selectedDefaulter, setSelectedDefaulter] = useState<{
    id: string
    name: string
    unit: string
    penalties: PenaltyRow[]
  } | null>(null)
  const [waiveReasonMap, setWaiveReasonMap] = useState<Record<string, string>>({})
  const [waivingPenaltyId, setWaivingPenaltyId] = useState<string | null>(null)
  const [waivedIds, setWaivedIds] = useState<Set<string>>(new Set())

  const defaulters = useMemo(() => {
    const rows: {
      shareholderId: string
      shareholderName: string
      unit: string
      phone: string
      itemId: string
      milestoneName: string | null
      dueDate: Date
      installmentAmount: number
      paid: number
      principalDue: number
      penalty: number
      penalties: PenaltyRow[]
    }[] = []

    overdueItems.forEach(item => {
      const sh = item.shareholder
      if (!sh) return

      const paid = payments
        .filter(p => p.schedule_item_id === item.id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

      const principalDue = Math.max(0, (parseFloat(item.amount) || 0) - paid)

      let itemPenalty = 0
      const itemPenalties: PenaltyRow[] = []
      if (item.penalties) {
        item.penalties.forEach((p: any) => {
          if (!p.is_waived && !waivedIds.has(p.id) && parseFloat(p.amount) > 0) {
            itemPenalty += parseFloat(p.amount)
            itemPenalties.push({
              id: p.id,
              amount: parseFloat(p.amount),
              calculated_at: p.calculated_at,
              schedule_item_id: item.id,
              due_date: item.due_date,
              installment_amount: parseFloat(item.amount) || 0,
              milestone_name: item.milestone?.name || null,
            })
          }
        })
      }

      rows.push({
        shareholderId: sh.id,
        shareholderName: sh.profiles?.name || "Unknown",
        unit: sh.unit_flat,
        phone: sh.profiles?.phone || "N/A",
        itemId: item.id,
        milestoneName: item.milestone?.name || null,
        dueDate: new Date(item.due_date),
        installmentAmount: parseFloat(item.amount) || 0,
        paid,
        principalDue,
        penalty: itemPenalty,
        penalties: itemPenalties,
      })
    })

    return rows.sort((a, b) => b.principalDue - a.principalDue)
  }, [overdueItems, payments, waivedIds])

  const handleApplyPenalties = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/penalties/apply`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Penalty sweeps completed.")
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const openWaiveDialog = (item: any) => {
    setSelectedDefaulter({
      id: item.shareholderId,
      name: item.shareholderName,
      unit: item.unit,
      penalties: item.penalties,
    })
    setWaiveReasonMap({})
    setWaiveDialogOpen(true)
  }

  const handleWaivePenalty = async (penaltyId: string) => {
    const reason = waiveReasonMap[penaltyId]?.trim()
    if (!reason) {
      toast.error("Please provide a reason for waiving this penalty.")
      return
    }

    setWaivingPenaltyId(penaltyId)
    try {
      const res = await fetch(`/api/projects/${projectId}/penalties/${penaltyId}/waive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waive_reason: reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Penalty waived successfully.")

      setSelectedDefaulter(prev =>
        prev ? { ...prev, penalties: prev.penalties.filter(p => p.id !== penaltyId) } : null
      )

      setWaivedIds(prev => new Set(prev).add(penaltyId))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setWaivingPenaltyId(null)
    }
  }

  const handleWaiveAll = async () => {
    if (!selectedDefaulter || selectedDefaulter.penalties.length === 0) return

    const reason = waiveReasonMap["__all__"]?.trim()
    if (!reason) {
      toast.error("Please provide a reason for waiving all penalties.")
      return
    }

    setIsProcessing(true)
    try {
      let waivedCount = 0
      for (const p of selectedDefaulter.penalties) {
        const res = await fetch(`/api/projects/${projectId}/penalties/${p.id}/waive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waive_reason: reason }),
        })
        if (res.ok) waivedCount++
      }
      toast.success(`${waivedCount} penalty(ies) waived.`)
      setWaiveDialogOpen(false)

      setWaivedIds(prev => {
        const next = new Set(prev)
        selectedDefaulter.penalties.forEach(p => next.add(p.id))
        return next
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleApplyPenalties}
          disabled={isProcessing}
          variant="default"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          {isProcessing && !waiveDialogOpen ? "Processing..." : "Trigger Penalty Sweep"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6">Shareholder</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Expected (৳)</TableHead>
              <TableHead className="text-right">Paid (৳)</TableHead>
              <TableHead className="text-right">Due (৳)</TableHead>
              <TableHead className="text-right text-[var(--destructive)]">Penalty (৳)</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaulters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center text-outline">
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-10 text-primary" />
                    <p className="text-lg font-medium text-on-surface-variant">No active defaulters</p>
                    <p className="text-sm">Great! All shareholders are currently up to date on payments.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              defaulters.map((d, i) => (
                <TableRow key={i} className="group">
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-[var(--foreground)]">
                        {d.shareholderName}
                      </span>
                      <span className="text-[12px] text-[var(--on-surface-variant)] mt-0.5">
                        Unit: {d.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-on-surface">
                    {d.milestoneName || "General"}
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-bold text-[#964B00] bg-[#FFDDB3] px-3 py-1 rounded-full uppercase tracking-wider">
                      {d.dueDate.toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-on-surface-variant">
                    ৳ {d.installmentAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-sm text-primary font-semibold">
                    ৳ {d.paid.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-medium text-on-surface">
                    ৳ {d.principalDue.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    ৳ {d.penalty.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-1">
                      {d.penalties.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => openWaiveDialog(d)}
                          title="Waive Penalty"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="size-8 p-0 text-on-surface-variant hover:text-primary" title="Send Reminder">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Waive Penalties — {selectedDefaulter?.name}</DialogTitle>
            <DialogDescription>
              Unit {selectedDefaulter?.unit} · {selectedDefaulter?.penalties.length || 0} active penalty(ies)
            </DialogDescription>
          </DialogHeader>

          {selectedDefaulter && selectedDefaulter.penalties.length > 0 && (
            <div className="space-y-4">
              {selectedDefaulter.penalties.map((p) => (
                <div
                  key={p.id}
                  className="border border-outline-variant/40 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {p.milestone_name || "Payment Installment"}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Due: {new Date(p.due_date).toLocaleDateString()} · Installment: ৳{p.installment_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-destructive">
                      ৳ {p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Reason for waiver *</Label>
                    <Textarea
                      placeholder="e.g. Medical emergency, system error..."
                      value={waiveReasonMap[p.id] || ""}
                      onChange={(e) =>
                        setWaiveReasonMap(prev => ({ ...prev, [p.id]: e.target.value }))
                      }
                      className="text-sm min-h-[60px]"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    disabled={!waiveReasonMap[p.id]?.trim() || waivingPenaltyId === p.id}
                    onClick={() => handleWaivePenalty(p.id)}
                  >
                    {waivingPenaltyId === p.id ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Waiving...</>
                    ) : (
                      <><ShieldOff className="w-3.5 h-3.5 mr-1.5" /> Waive This Penalty</>
                    )}
                  </Button>
                </div>
              ))}

              {selectedDefaulter.penalties.length > 1 && (
                <div className="border-t border-outline-variant/40 pt-4 space-y-3">
                  <Label className="text-xs font-semibold">Waive All Penalties at Once</Label>
                  <Textarea
                    placeholder="Reason for waiving all penalties..."
                    value={waiveReasonMap["__all__"] || ""}
                    onChange={(e) =>
                      setWaiveReasonMap(prev => ({ ...prev, __all__: e.target.value }))
                    }
                    className="text-sm min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    disabled={!waiveReasonMap["__all__"]?.trim() || isProcessing}
                    onClick={handleWaiveAll}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Waiving All...</>
                    ) : (
                      `Waive All ${selectedDefaulter.penalties.length} Penalties`
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedDefaulter && selectedDefaulter.penalties.length === 0 && (
            <p className="text-sm text-on-surface-variant py-4 text-center">
              No active penalties remaining for this shareholder.
            </p>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}
