"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, CheckCircle, FileText, SendHorizontal, AlertCircle, RefreshCw, XCircle, Eye, Edit2, Trash2, Receipt as ReceiptIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ExpenseForm } from "./ExpenseForm"
import { EmptyState } from "@/components/EmptyState"
import Link from "next/link"

interface ExpensesClientProps {
  projectId: string
  expenses: any[]
  milestones: any[]
  categories: any[]
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  DRAFT: { label: "Draft", color: "bg-surface-variant/50 text-slate-700 border-slate-200", icon: FileText },
  SUBMITTED: { label: "Submitted", color: "bg-tertiary-container/50 text-tertiary border-blue-200", icon: SendHorizontal },
  CHANGES_REQUESTED: { label: "Changes Req.", color: "bg-orange-100 text-orange-700 border-orange-200", icon: RefreshCw },
  APPROVED: { label: "Approved", color: "bg-primary-container/50 text-primary border-green-200", icon: CheckCircle },
  PUBLISHED: { label: "Published", color: "bg-primary-container/50 text-on-primary-container border-primary-container", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-error-container/50 text-destructive border-error-container", icon: XCircle }
}

export function ExpensesClient({ projectId, expenses: initialExpenses, milestones, categories }: ExpensesClientProps) {
  const router = useRouter()
  const [expenses, setExpenses] = useState<any[]>(initialExpenses)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Pipeline counts
  const counts = expenses.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filteredExpenses = filterStatus 
    ? expenses.filter(e => e.status === filterStatus)
    : expenses

  const openAddForm = () => {
    setEditingExpense(null)
    setIsFormOpen(true)
  }

  const openEditForm = (exp: any) => {
    setEditingExpense(exp)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this expense?")) return
    setIsPublishing(true) // Reuse layout blocking state
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Expense deleted successfully.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePublishOne = async (id: string) => {
    setPublishingId(id)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${id}/publish`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Update the expense in the list to PUBLISHED status instantly
      setExpenses(prev => prev.map(exp =>
        exp.id === id ? { ...exp, status: "PUBLISHED" } : exp
      ))

      toast.success("Expense published successfully.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPublishingId(null)
    }
  }

  const handleBulkPublish = async () => {
     if (selectedIds.size === 0) return
     if (!confirm(`Are you sure you want to publish ${selectedIds.size} approved expense(s)?`)) return
     
     setIsPublishing(true)
     try {
       const res = await fetch(`/api/projects/${projectId}/expenses/bulk-publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expenseIds: Array.from(selectedIds) })
       })
       if (!res.ok) {
         const data = await res.json()
         throw new Error(data.error)
       }
       toast.success("Expenses published successfully!")
       setSelectedIds(new Set())
       router.refresh()
     } catch (err: any) {
       toast.error(err.message)
     } finally {
       setIsPublishing(false)
     }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  return (
    <div className="space-y-6">
      
      {/* Pipeline Badges */}
      <div className="flex gap-3 overflow-x-auto pb-2">
         {Object.entries(statusConfig).map(([statusKey, config]) => {
            const count = counts[statusKey] || 0
            const active = filterStatus === statusKey
            const Icon = config.icon
            return (
              <button
                key={statusKey}
                onClick={() => setFilterStatus(active ? null : statusKey)}
                className={`flex flex-col min-w-[120px] p-3 rounded-xl border transition-all text-left ${active ? 'ring-2 ring-primary bg-surface' : 'bg-surface-variant/20/50 hover:bg-surface-variant/20 border-outline-variant/40'}`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>{count}</span>
                </div>
                <span className="text-sm font-medium text-on-surface">{config.label}</span>
              </button>
            )
         })}
      </div>

      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-lg font-semibold text-on-surface">Expenses {filterStatus && `(${statusConfig[filterStatus].label})`}</h2>
            <p className="text-sm text-on-surface-variant">Manage and track project expenditures.</p>
         </div>
         <div className="flex gap-2">
            {selectedIds.size > 0 && filterStatus === "APPROVED" && (
              <Button onClick={handleBulkPublish} disabled={isPublishing} className="bg-primary hover:bg-primary">
                 {isPublishing ? "Publishing..." : `Publish Selected (${selectedIds.size})`}
              </Button>
            )}
            <Button onClick={openAddForm} className="bg-primary hover:bg-primary">
               <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
         </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden">
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount (৳)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="p-0 border-0">
                      <EmptyState
                        icon={ReceiptIcon}
                        title="No expenses recorded yet"
                        description="Start by creating your first expense entry to track project expenditures."
                        actionLabel="Add Expense"
                        onAction={openAddForm}
                        className="border-0 rounded-none shadow-none"
                      />
                   </TableCell>
                 </TableRow>
              ) : (
                 filteredExpenses.map((expense) => {
                    const statusUI = statusConfig[expense.status] || statusConfig.DRAFT
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {expense.status === "APPROVED" && (
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(expense.id)}
                              onChange={() => toggleSelect(expense.id)}
                              className="rounded border-outline-variant text-primary focus:ring-primary"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-on-surface">
                           <Link href={`/${projectId}/expenses/${expense.id}`} className="hover:text-primary hover:underline">
                             {expense.title}
                           </Link>
                        </TableCell>
                        <TableCell className="text-sm text-on-surface-variant">{expense.category?.name}</TableCell>
                        <TableCell className="text-sm font-medium text-on-surface">
                           {(expense.amount + (expense.vat_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusUI.color}`}>
                             {statusUI.label}
                           </span>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-1 text-primary">
                             {(expense.status === "DRAFT" || expense.status === "CHANGES_REQUESTED") && (
                               <Button variant="ghost" size="icon" onClick={() => openEditForm(expense)} className="hover:text-on-primary-container hover:bg-primary-container/20 w-8 h-8 rounded-full" title="Edit Expense">
                                  <Edit2 className="w-4 h-4" />
                               </Button>
                             )}
                             {expense.status === "APPROVED" && (
                               <button
                                 onClick={() => handlePublishOne(expense.id)}
                                 disabled={publishingId === expense.id}
                                 className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                               >
                                  {publishingId === expense.id ? "Publishing..." : "Publish"}
                               </button>
                             )}
                             <Link href={`/${projectId}/expenses/${expense.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:text-on-primary-container hover:bg-primary-container/20 transition-colors" title="View Details">
                               <Eye className="w-4 h-4" />
                             </Link>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-destructive hover:bg-error-container/20 w-8 h-8 rounded-full" title="Delete Expense">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    )
                 })
              )}
            </TableBody>
         </Table>
      </div>

      <ExpenseForm
         projectId={projectId}
         isOpen={isFormOpen}
         onClose={() => setIsFormOpen(false)}
         milestones={milestones}
         categories={categories}
         expense={editingExpense}
      />
    </div>
  )
}
