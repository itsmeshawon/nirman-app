"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, FileText, Download, Building, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface ReviewClientProps {
  expenses: any[]
}

export function ReviewClient({ expenses }: ReviewClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<"REJECTED" | "CHANGES_REQUESTED" | null>(null)
  const [modalExpenseId, setModalExpenseId] = useState<string | null>(null)
  const [modalProjectId, setModalProjectId] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  const handleAction = async (expenseId: string, projectId: string, action: string, actionComment?: string) => {
    setIsProcessing(expenseId)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: actionComment })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success(data.newStatus === "APPROVED" 
        ? "Expense successfully approved." 
        : `Action recorded: ${action.replace('_', ' ')}`
      )
      
      setModalOpen(false)
      setComment("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(null)
    }
  }

  const openModal = (expenseId: string, projectId: string, action: "REJECTED" | "CHANGES_REQUESTED") => {
    setModalExpenseId(expenseId)
    setModalProjectId(projectId)
    setModalAction(action)
    setComment("")
    setModalOpen(true)
  }

  const confirmModalAction = () => {
    if (!comment.trim()) {
      toast.error("A comment is required for this action.")
      return
    }
    if (modalExpenseId && modalProjectId && modalAction) {
      handleAction(modalExpenseId, modalProjectId, modalAction, comment)
    }
  }

  return (
    <div className="space-y-6">
      {expenses.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-gray-500 shadow-sm">
           <CheckCircle className="w-12 h-12 text-teal-200 mx-auto mb-4" />
           <p>All caught up! No expenses currently require your review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {expenses.map((expense) => {
             const progressPct = expense.totalMembers > 0 
                ? Math.min(100, Math.round((expense.totalApprovals / (expense.totalMembers / 2)) * 100)) 
                : 0

             return (
               <div key={expense.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                 {/* Left Details */}
                 <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0F766E] uppercase tracking-widest mb-3">
                      <Building className="w-4 h-4" />
                      {expense.projectName}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{expense.title}</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                       <div>
                         <p className="text-xs text-gray-500">Amount</p>
                         <p className="text-lg font-semibold text-gray-900">৳ {expense.amount.toLocaleString()}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500">Date</p>
                         <p className="text-sm font-medium text-gray-900">{new Date(expense.date).toLocaleDateString()}</p>
                       </div>
                       <div>
                         <p className="text-xs text-gray-500">Category</p>
                         <p className="text-sm font-medium text-gray-900">{expense.category?.name || "Uncategorized"}</p>
                       </div>
                    </div>
                    
                    {/* Proof Thumbnails */}
                    {expense.attachments && expense.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-xs font-medium text-gray-500 mb-2">Proof Attachments</p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                           {expense.attachments.map((att: any) => {
                             const { data: urlData } = supabase.storage.from("expense-proofs").getPublicUrl(att.file_path)
                             const isImage = att.file_type.startsWith("image/")
                             return (
                               <a key={att.id} href={urlData.publicUrl} target="_blank" rel="noopener noreferrer" 
                                  className="flex-shrink-0 relative group rounded-md overflow-hidden border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-teal-500 transition-all w-24 h-16 sm:w-32 sm:h-20"
                               >
                                  {isImage ? (
                                    <img src={urlData.publicUrl} alt={att.file_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-red-600">
                                      <FileText className="w-6 h-6 mb-1" />
                                      <span className="text-[10px] text-gray-500 truncate w-full text-center px-1">PDF</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Download className="w-5 h-5 text-white" />
                                  </div>
                               </a>
                             )
                           })}
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Right Actions */}
                 <div className="p-6 md:w-[320px] bg-slate-50 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-3">Approval Progress</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                         <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${progressPct}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {expense.totalApprovals} of {expense.totalMembers} active members approved (Majority rules)
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                       <Button 
                         onClick={() => handleAction(expense.id, expense.project_id, "APPROVED")} 
                         disabled={isProcessing === expense.id}
                         className="w-full bg-[#0F766E] hover:bg-teal-800 h-12"
                       >
                         <CheckCircle className="w-5 h-5 mr-2" /> Approve
                       </Button>
                       <div className="flex gap-3">
                          <Button 
                            variant="outline"
                            onClick={() => openModal(expense.id, expense.project_id, "CHANGES_REQUESTED")} 
                            disabled={isProcessing === expense.id}
                            className="flex-1 bg-white text-orange-700 hover:text-orange-800 border-orange-200 hover:bg-orange-50"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Modify
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => openModal(expense.id, expense.project_id, "REJECTED")} 
                            disabled={isProcessing === expense.id}
                            className="flex-1 bg-white text-red-700 hover:text-red-800 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                          </Button>
                       </div>
                    </div>
                 </div>
               </div>
             )
          })}
        </div>
      )}

      {/* Rejection / Modification Comment Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
                {modalAction === "REJECTED" ? <XCircle className="w-5 h-5 text-red-600" /> : <RefreshCw className="w-5 h-5 text-orange-600" />}
                {modalAction === "REJECTED" ? "Reject Expense" : "Request Changes"}
             </DialogTitle>
             <DialogDescription>
                Please provide a precise reason. This will be visible to the Project Admin and logged in the governance trail.
             </DialogDescription>
           </DialogHeader>
           <div className="mt-4">
              <Textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Type your reasoning here..."
                className="h-24 focus-visible:ring-teal-500"
              />
           </div>
           <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button 
                 onClick={confirmModalAction} 
                 className={modalAction === "REJECTED" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
              >
                 Submit Feedback
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
