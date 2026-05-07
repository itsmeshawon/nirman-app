"use client"

import { useState, useEffect } from "react"
import { CheckCircle, FileText, Download, SendHorizontal, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ExpenseForm } from "./ExpenseForm"

interface ExpenseDetailModalProps {
  projectId: string
  expenseId: string | null
  initialExpense?: any | null
  milestones: any[]
  categories: any[]
  onClose: () => void
  onDeleted: (id: string) => void
  onUpdated: (expense: any) => void
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-surface-variant/50 text-on-surface-variant" },
  SUBMITTED: { label: "Submitted for Review", color: "bg-secondary-container text-on-secondary-container" },
  CHANGES_REQUESTED: { label: "Changes Requested", color: "bg-warning-container text-on-warning-container" },
  APPROVED: { label: "Approved by Committee", color: "bg-success-container text-on-success-container" },
  PUBLISHED: { label: "Published Ledger", color: "bg-primary-container text-on-primary-container" },
  REJECTED: { label: "Rejected", color: "bg-error-container text-on-error-container" },
}

export function ExpenseDetailModal({
  projectId,
  expenseId,
  initialExpense,
  milestones,
  categories,
  onClose,
  onDeleted,
  onUpdated,
}: ExpenseDetailModalProps) {
  const supabase = createClient()
  const [expense, setExpense] = useState<any>(initialExpense ?? null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  useEffect(() => {
    if (!expenseId) { setExpense(null); return }
    // Render immediately from initialExpense, then enrich with attachments + approvals
    setExpense(initialExpense ?? null)
    fetch(`/api/projects/${projectId}/expenses/${expenseId}`)
      .then(r => r.json())
      .then(d => { if (d.expense) setExpense(d.expense) })
      .catch(() => {})
  }, [expenseId, projectId])

  const handleSubmit = async () => {
    if (!expense) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}/submit`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const updated = { ...expense, status: "SUBMITTED" }
      setExpense(updated)
      onUpdated(updated)
      toast.success("Expense submitted to committee.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePublish = async () => {
    if (!expense) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}/publish`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const updated = { ...expense, status: "PUBLISHED" }
      setExpense(updated)
      onUpdated(updated)
      toast.success("Expense published successfully.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!expense) return
    if (!confirm("Delete this expense permanently?")) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Expense deleted.")
      onDeleted(expense.id)
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditSaved = (savedExpense: any) => {
    const merged = { ...expense, ...savedExpense }
    setExpense(merged)
    onUpdated(merged)
  }

  const statusUI = expense ? statusConfig[expense.status] : null

  return (
    <>
      <Dialog open={!!expenseId} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>

          {!expense ? (
            <div className="flex items-center justify-center py-16 text-sm text-on-surface-variant">Loading...</div>
          ) : (
            <div className="space-y-6 mt-2">
              {/* Status + Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusUI?.color}`}>
                  {statusUI?.label}
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={isProcessing}
                    size="sm"
                    className="bg-error-container/20 text-destructive hover:bg-error-container/50 border border-error-container"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                  {(expense.status === "DRAFT" || expense.status === "CHANGES_REQUESTED") && (
                    <Button
                      onClick={() => setIsEditFormOpen(true)}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                      className="text-primary border-primary-container bg-primary-container/20 hover:bg-primary-container/50"
                    >
                      <Edit className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                  )}
                  {expense.status === "DRAFT" && (
                    <Button onClick={handleSubmit} disabled={isProcessing} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <SendHorizontal className="w-4 h-4 mr-1.5" /> Submit for Approval
                    </Button>
                  )}
                  {expense.status === "CHANGES_REQUESTED" && (
                    <Button onClick={handleSubmit} disabled={isProcessing} size="sm" className="bg-tertiary hover:bg-tertiary/90 text-on-tertiary">
                      <SendHorizontal className="w-4 h-4 mr-1.5" /> Resubmit
                    </Button>
                  )}
                  {expense.status === "APPROVED" && (
                    <Button onClick={handlePublish} disabled={isProcessing} size="sm" className="bg-primary hover:bg-primary">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Publish Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Info */}
              <div className="bg-surface rounded-xl border border-outline-variant/40 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl text-on-surface font-medium mb-1">{expense.title}</h2>
                  <p className="text-xs text-on-surface-variant mb-6">
                    ID: {expense.id.slice(0, 8)} • Created {new Date(expense.created_at).toLocaleDateString()}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-1">Amount</p>
                      <p className="text-lg font-semibold text-on-surface">৳ {expense.amount.toLocaleString()}</p>
                      {expense.vat_amount > 0 && <p className="text-xs text-on-surface-variant">+ ৳{expense.vat_amount} VAT</p>}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-1">Date</p>
                      <p className="text-sm font-medium text-on-surface">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-1">Category</p>
                      <p className="text-sm font-medium text-on-surface">{expense.category?.name || "Uncategorized"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-1">Milestone</p>
                      <p className="text-sm font-medium text-on-surface">{expense.milestone?.name || "General"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expense.notes && (
                      <div className="bg-surface-variant/20 p-4 rounded-lg">
                        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-2">Notes</p>
                        <p className="text-sm text-on-surface whitespace-pre-wrap">{expense.notes}</p>
                      </div>
                    )}
                    {expense.invoice_no && (
                      <div className="bg-surface-variant/20 p-4 rounded-lg">
                        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-2">Invoice Number</p>
                        <p className="text-sm font-medium text-on-surface">{expense.invoice_no}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                <div className="border-t bg-surface-variant/10 p-6">
                  <h3 className="text-xs font-medium text-on-surface uppercase tracking-widest mb-4">
                    Proof Attachments ({expense.attachments?.length || 0})
                  </h3>
                  {expense.attachments && expense.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {expense.attachments.map((att: any) => {
                        const { data: urlData } = supabase.storage.from("expense-proofs").getPublicUrl(att.file_path)
                        const isImage = att.file_type?.startsWith("image/")
                        return (
                          <a
                            key={att.id}
                            href={urlData.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface p-3 hover:border-primary hover:ring-1 hover:ring-primary transition-all"
                          >
                            {isImage ? (
                              <img src={urlData.publicUrl} alt={att.file_name} className="w-10 h-10 rounded object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-error-container/50 flex items-center justify-center text-destructive">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-on-surface truncate">{att.file_name}</p>
                              <p className="text-xs text-on-surface-variant">{(att.file_size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Download className="w-4 h-4 text-on-surface-variant group-hover:text-primary" />
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-on-surface-variant p-4 bg-surface rounded border border-dashed border-outline-variant text-center">
                      No attachments uploaded.{expense.status === "DRAFT" && " You must attach proofs before submitting."}
                    </div>
                  )}
                </div>
              </div>

              {/* Governance Timeline */}
              {expense.status !== "DRAFT" && (
                <div className="bg-surface rounded-xl border border-outline-variant/40 overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium text-on-surface">Governance Timeline</h3>
                  </div>
                  <div className="p-6">
                    <div className="relative border-l-2 border-outline-variant/40 ml-4 space-y-6 pb-2">
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-tertiary-container ring-4 ring-white" />
                        <p className="text-sm font-semibold text-on-surface">Submitted for Review</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">By Project Admin • {new Date(expense.created_at).toLocaleString()}</p>
                      </div>
                      {expense.approvals?.map((app: any) => {
                        const cfg: Record<string, { ring: string; label: string }> = {
                          APPROVED: { ring: "bg-success-container", label: "Approved" },
                          REJECTED: { ring: "bg-error-container", label: "Rejected" },
                          CHANGES_REQUESTED: { ring: "bg-warning-container", label: "Changes Requested" },
                        }
                        const ac = cfg[app.action] ?? { ring: "bg-outline", label: app.action }
                        return (
                          <div key={app.id} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${ac.ring} ring-4 ring-white`} />
                            <p className="text-sm font-semibold text-on-surface">{ac.label}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {app.user?.name} ({app.user?.email}) • {new Date(app.created_at).toLocaleString()}
                            </p>
                            {app.comment && (
                              <div className="mt-2 text-sm text-on-surface bg-surface-variant/20 p-3 rounded rounded-tl-none inline-block">
                                "{app.comment}"
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {expense.published_at && (
                        <div className="relative pl-6">
                          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                          <p className="text-sm font-semibold text-on-surface">Published to Ledger</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{new Date(expense.published_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {expense && (
        <ExpenseForm
          projectId={projectId}
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSave={handleEditSaved}
          milestones={milestones}
          categories={categories}
          expense={expense}
        />
      )}
    </>
  )
}
