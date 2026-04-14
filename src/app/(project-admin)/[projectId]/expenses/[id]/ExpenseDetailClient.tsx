"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, Download, SendHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ExpenseForm } from "../ExpenseForm"

interface ExpenseDetailClientProps {
  projectId: string
  expense: any
  milestones: any[]
  categories: any[]
}

export function ExpenseDetailClient({ projectId, expense, milestones, categories }: ExpenseDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}/submit`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Expense submitted to committee.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePublish = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}/publish`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Expense published successfully.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this draft expense permanently?")) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expense.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Expense deleted.")
      router.push(`/${projectId}/expenses`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const statusConfig: Record<string, { label: string, color: string }> = {
    DRAFT: { label: "Draft", color: "bg-surface-variant/50 text-slate-700" },
    SUBMITTED: { label: "Submitted for Review", color: "bg-tertiary-container/50 text-tertiary" },
    CHANGES_REQUESTED: { label: "Changes Requested", color: "bg-orange-100 text-orange-700" },
    APPROVED: { label: "Approved by Committee", color: "bg-primary-container/50 text-primary" },
    PUBLISHED: { label: "Published Ledger", color: "bg-primary-container/50 text-on-primary-container" },
    REJECTED: { label: "Rejected", color: "bg-error-container/50 text-destructive" }
  }

  const statusUI = statusConfig[expense.status]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Link href={`/${projectId}/expenses`} className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-surface-variant/50 transition-colors">
             <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
           </Link>
           <h1 className="text-2xl font-bold text-on-surface">Expense Details</h1>
           <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusUI?.color}`}>
             {statusUI?.label}
           </span>
         </div>

         <div className="flex gap-2">
           <Button onClick={handleDelete} variant="destructive" disabled={isProcessing} className="bg-error-container/20 text-destructive hover:bg-error-container/50 border border-error-container">
             <Trash2 className="w-4 h-4 mr-2" /> Delete
           </Button>

           {(expense.status === "DRAFT" || expense.status === "CHANGES_REQUESTED") && (
             <Button onClick={() => setIsEditFormOpen(true)} disabled={isProcessing} variant="outline" className="text-primary border-primary-container bg-primary-container/20 hover:bg-primary-container/50">
               <Edit className="w-4 h-4 mr-2" /> Edit Expense
             </Button>
           )}
           {expense.status === "DRAFT" && (
             <Button onClick={handleSubmit} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
               <SendHorizontal className="w-4 h-4 mr-2" /> Submit for Approval
             </Button>
           )}
           {expense.status === "CHANGES_REQUESTED" && (
              <Button onClick={handleSubmit} disabled={isProcessing} className="bg-orange-600 hover:bg-orange-700">
                 <SendHorizontal className="w-4 h-4 mr-2" /> Resubmit
               </Button>
           )}
           {expense.status === "APPROVED" && (
              <Button onClick={handlePublish} disabled={isProcessing} className="bg-primary hover:bg-primary">
                 <CheckCircle className="w-4 h-4 mr-2" /> Publish Now
              </Button>
           )}
         </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-surface rounded-xl border border-outline-variant/50 overflow-hidden">
        <div className="p-6 md:p-8">
           <h2 className="text-2xl text-on-surface font-medium mb-1">{expense.title}</h2>
           <p className="text-sm text-on-surface-variant mb-6 flex items-center gap-2">
             ID: {expense.id.slice(0,8)} • Created on {new Date(expense.created_at).toLocaleDateString()}
           </p>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mb-1">Amount</p>
                <p className="text-xl font-semibold text-on-surface">৳ {expense.amount.toLocaleString()}</p>
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

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Proof Attachments */}
        <div className="border-t bg-surface-variant/10 p-6 md:p-8">
           <h3 className="text-sm font-medium text-on-surface uppercase tracking-widest mb-4">Proof Attachments ({expense.attachments?.length || 0})</h3>
           
           {expense.attachments && expense.attachments.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {expense.attachments.map((att: any) => {
                   const { data: urlData } = supabase.storage.from("expense-proofs").getPublicUrl(att.file_path)
                   const isImage = att.file_type.startsWith("image/")

                   return (
                     <a key={att.id} href={urlData.publicUrl} target="_blank" rel="noopener noreferrer" className="group relative block w-full rounded-lg border border-outline-variant/50 bg-surface p-3 hover:border-primary hover:ring-1 hover:ring-primary transition-all">
                        <div className="flex items-center gap-3">
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
                           <Download className="w-4 h-4 text-outline group-hover:text-primary" />
                        </div>
                     </a>
                   )
                })}
             </div>
           ) : (
             <div className="text-sm text-on-surface-variant p-4 bg-surface rounded border border-dashed border-outline-variant flex items-center justify-center">
                No attachments uploaded. {expense.status === "DRAFT" && "You must attach proofs before submitting."}
             </div>
           )}
        </div>
      </div>

      {/* Governance Timeline */}
      {expense.status !== "DRAFT" && (
        <div className="bg-surface rounded-xl border border-outline-variant/50 overflow-hidden">
           <div className="p-6 border-b">
             <h3 className="text-lg font-medium text-on-surface">Governance Timeline</h3>
           </div>
           <div className="p-6">
             <div className="relative border-l-2 border-outline-variant/50 ml-4 space-y-8 pb-4">
                
                {/* Submission Log */}
                <div className="relative pl-6">
                   <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-tertiary-container/200 ring-4 ring-white" />
                   <p className="text-sm font-semibold text-on-surface">Submitted for Review</p>
                   <p className="text-xs text-on-surface-variant mt-0.5">By Project Admin • {new Date(expense.created_at).toLocaleString()}</p>
                </div>

                {/* Approvals Log */}
                {expense.approvals?.map((app: any) => {
                   let iconClass = "bg-outline"
                   let title = ""
                   if (app.action === "APPROVED") { iconClass = "bg-primary-container/200"; title = "Approved" }
                   if (app.action === "REJECTED") { iconClass = "bg-error-container/200"; title = "Rejected" }
                   if (app.action === "CHANGES_REQUESTED") { iconClass = "bg-orange-500"; title = "Changes Requested" }

                   return (
                     <div key={app.id} className="relative pl-6">
                       <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${iconClass} ring-4 ring-white`} />
                       <p className="text-sm font-semibold text-on-surface">{title}</p>
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

                {/* Published Log */}
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

      <ExpenseForm
         projectId={projectId}
         isOpen={isEditFormOpen}
         onClose={() => setIsEditFormOpen(false)}
         milestones={milestones}
         categories={categories}
         expense={expense}
      />

    </div>
  )
}
