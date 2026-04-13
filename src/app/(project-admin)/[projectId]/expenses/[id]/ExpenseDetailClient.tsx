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
    DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700" },
    SUBMITTED: { label: "Submitted for Review", color: "bg-blue-100 text-blue-700" },
    CHANGES_REQUESTED: { label: "Changes Requested", color: "bg-orange-100 text-orange-700" },
    APPROVED: { label: "Approved by Committee", color: "bg-green-100 text-green-700" },
    PUBLISHED: { label: "Published Ledger", color: "bg-indigo-100 text-indigo-800" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" }
  }

  const statusUI = statusConfig[expense.status]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Link href={`/${projectId}/expenses`} className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-gray-100 transition-colors">
             <ArrowLeft className="w-5 h-5 text-gray-600" />
           </Link>
           <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
           <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusUI?.color}`}>
             {statusUI?.label}
           </span>
         </div>

         <div className="flex gap-2">
           <Button onClick={handleDelete} variant="destructive" disabled={isProcessing} className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
             <Trash2 className="w-4 h-4 mr-2" /> Delete
           </Button>

           {(expense.status === "DRAFT" || expense.status === "CHANGES_REQUESTED") && (
             <Button onClick={() => setIsEditFormOpen(true)} disabled={isProcessing} variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
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
              <Button onClick={handlePublish} disabled={isProcessing} className="bg-[#4F46E5] hover:bg-indigo-800">
                 <CheckCircle className="w-4 h-4 mr-2" /> Publish Now
              </Button>
           )}
         </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8">
           <h2 className="text-2xl text-gray-900 font-medium mb-1">{expense.title}</h2>
           <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
             ID: {expense.id.slice(0,8)} • Created on {new Date(expense.created_at).toLocaleDateString()}
           </p>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Amount</p>
                <p className="text-xl font-semibold text-gray-900">৳ {expense.amount.toLocaleString()}</p>
                {expense.vat_amount > 0 && <p className="text-xs text-gray-500">+ ৳{expense.vat_amount} VAT</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Date</p>
                <p className="text-sm font-medium text-gray-900">{new Date(expense.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Category</p>
                <p className="text-sm font-medium text-gray-900">{expense.category?.name || "Uncategorized"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Milestone</p>
                <p className="text-sm font-medium text-gray-900">{expense.milestone?.name || "General"}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {expense.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
                </div>
              )}
              {expense.invoice_no && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-900">{expense.invoice_no}</p>
                </div>
              )}
           </div>
        </div>

        {/* Proof Attachments */}
        <div className="border-t bg-slate-50/50 p-6 md:p-8">
           <h3 className="text-sm font-medium text-gray-900 uppercase tracking-widest mb-4">Proof Attachments ({expense.attachments?.length || 0})</h3>
           
           {expense.attachments && expense.attachments.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {expense.attachments.map((att: any) => {
                   const { data: urlData } = supabase.storage.from("expense-proofs").getPublicUrl(att.file_path)
                   const isImage = att.file_type.startsWith("image/")

                   return (
                     <a key={att.id} href={urlData.publicUrl} target="_blank" rel="noopener noreferrer" className="group relative block w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all">
                        <div className="flex items-center gap-3">
                           {isImage ? (
                             <img src={urlData.publicUrl} alt={att.file_name} className="w-10 h-10 rounded object-cover border" />
                           ) : (
                             <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-red-600">
                               <FileText className="w-5 h-5" />
                             </div>
                           )}
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{att.file_name}</p>
                              <p className="text-xs text-gray-500">{(att.file_size / 1024).toFixed(1)} KB</p>
                           </div>
                           <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                     </a>
                   )
                })}
             </div>
           ) : (
             <div className="text-sm text-gray-500 p-4 bg-white rounded border border-dashed border-gray-300 flex items-center justify-center">
                No attachments uploaded. {expense.status === "DRAFT" && "You must attach proofs before submitting."}
             </div>
           )}
        </div>
      </div>

      {/* Governance Timeline */}
      {expense.status !== "DRAFT" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-6 border-b">
             <h3 className="text-lg font-medium text-gray-900">Governance Timeline</h3>
           </div>
           <div className="p-6">
             <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-4">
                
                {/* Submission Log */}
                <div className="relative pl-6">
                   <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white" />
                   <p className="text-sm font-semibold text-gray-900">Submitted for Review</p>
                   <p className="text-xs text-gray-500 mt-0.5">By Project Admin • {new Date(expense.created_at).toLocaleString()}</p>
                </div>

                {/* Approvals Log */}
                {expense.approvals?.map((app: any) => {
                   let iconClass = "bg-gray-400"
                   let title = ""
                   if (app.action === "APPROVED") { iconClass = "bg-green-500"; title = "Approved" }
                   if (app.action === "REJECTED") { iconClass = "bg-red-500"; title = "Rejected" }
                   if (app.action === "CHANGES_REQUESTED") { iconClass = "bg-orange-500"; title = "Changes Requested" }

                   return (
                     <div key={app.id} className="relative pl-6">
                       <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${iconClass} ring-4 ring-white`} />
                       <p className="text-sm font-semibold text-gray-900">{title}</p>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {app.user?.name} ({app.user?.email}) • {new Date(app.created_at).toLocaleString()}
                       </p>
                       {app.comment && (
                         <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded rounded-tl-none inline-block">
                           "{app.comment}"
                         </div>
                       )}
                     </div>
                   )
                })}

                {/* Published Log */}
                {expense.published_at && (
                  <div className="relative pl-6">
                     <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />
                     <p className="text-sm font-semibold text-gray-900">Published to Ledger</p>
                     <p className="text-xs text-gray-500 mt-0.5">{new Date(expense.published_at).toLocaleString()}</p>
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
