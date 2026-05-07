"use client"

import { useState } from "react"
import { mutate } from "swr"
import { Plus, CheckCircle, FileText, SendHorizontal, RefreshCw, XCircle, Trash2, Eye, Edit2, Receipt as ReceiptIcon, Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ExpenseForm } from "./ExpenseForm"
import { ExpenseDetailModal } from "./ExpenseDetailModal"
import { EmptyState } from "@/components/EmptyState"

interface ExpensesClientProps {
  projectId: string
  expenses: any[]
  milestones: any[]
  categories: any[]
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  DRAFT: { label: "Draft", color: "bg-surface-variant/50 text-on-surface-variant border-outline-variant", icon: FileText },
  SUBMITTED: { label: "Submitted", color: "bg-secondary-container text-on-secondary-container border-secondary-container", icon: SendHorizontal },
  CHANGES_REQUESTED: { label: "Changes Req.", color: "bg-warning-container text-on-warning-container border-warning-container", icon: RefreshCw },
  APPROVED: { label: "Approved", color: "bg-success-container text-on-success-container border-success-container", icon: CheckCircle },
  PUBLISHED: { label: "Published", color: "bg-primary-container text-on-primary-container border-primary-container", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-error-container text-on-error-container border-error-container", icon: XCircle }
}

export function ExpensesClient({ projectId, expenses: initialExpenses, milestones, categories }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set())
  const [filterMilestones, setFilterMilestones] = useState<Set<string>>(new Set())
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set())
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null)
  const [detailExpense, setDetailExpense] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)

  const filteredExpenses = expenses.filter(e => {
    if (searchTerm && !e.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterStatuses.size > 0 && !filterStatuses.has(e.status)) return false
    if (filterMilestones.size > 0) {
      const milestoneId = e.milestone?.id ?? "none"
      if (!filterMilestones.has(milestoneId)) return false
    }
    if (filterCategories.size > 0 && !filterCategories.has(e.category?.id)) return false
    if (fromDate) {
      const expenseDate = new Date(e.date)
      const filterFromDate = new Date(fromDate)
      if (expenseDate < filterFromDate) return false
    }
    if (toDate) {
      const expenseDate = new Date(e.date)
      const filterToDate = new Date(toDate)
      filterToDate.setHours(23, 59, 59, 999)
      if (expenseDate > filterToDate) return false
    }
    return true
  })

  const toggleStatus = (status: string) => {
    setFilterStatuses(prev => {
      const next = new Set(prev)
      next.has(status) ? next.delete(status) : next.add(status)
      return next
    })
  }

  const toggleMilestone = (id: string) => {
    setFilterMilestones(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleCategory = (id: string) => {
    setFilterCategories(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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
    setIsPublishing(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Expense deleted successfully.")
      setExpenses(prev => prev.filter(e => e.id !== id))
      mutate(`/api/projects/${projectId}/page-data/expenses`)
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
      mutate(`/api/projects/${projectId}/page-data/expenses`)
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
       setExpenses(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, status: "PUBLISHED" } : e))
       mutate(`/api/projects/${projectId}/page-data/expenses`)
     } catch (err: any) {
       toast.error(err.message)
     } finally {
       setIsPublishing(false)
     }
  }

  const handleExpenseSaved = (savedExpense: any) => {
    setExpenses(prev => {
      const exists = prev.some(e => e.id === savedExpense.id)
      if (exists) return prev.map(e => e.id === savedExpense.id ? { ...e, ...savedExpense } : e)
      return [savedExpense, ...prev]
    })
    mutate(`/api/projects/${projectId}/page-data/expenses`)
  }

  const downloadReport = () => {
    setIsExporting(true)
    try {
      const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount + (e.vat_amount || 0), 0)
      const dateStr = fromDate || toDate
        ? `${fromDate ? new Date(fromDate).toLocaleDateString() : "Start"} - ${toDate ? new Date(toDate).toLocaleDateString() : "End"}`
        : "All Dates"

      let csvContent = "data:text/csv;charset=utf-8,"
      csvContent += "Expenses Report\n"
      csvContent += `Period: ${dateStr}\n`
      csvContent += `Total Amount: ৳ ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n`
      csvContent += "Date,Title,Category,Milestone,Amount,Status\n"

      filteredExpenses.forEach(e => {
        const amount = (e.amount + (e.vat_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })
        const status = statusConfig[e.status]?.label || e.status
        csvContent += `"${new Date(e.date).toLocaleDateString()}","${e.title}","${e.category?.name || "N/A"}","${e.milestone?.name || "—"}","${amount}","${status}"\n`
      })

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Expenses_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Report downloaded successfully!")
    } catch (error) {
      console.error("Report generation error:", error)
      toast.error("Failed to generate report")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">

      <div className="py-4 pr-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-full border border-outline-variant/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex justify-between items-center gap-3 flex-wrap">
        {/* Status, Milestone, Category, and Date Range filters */}
        <div className="flex gap-3 flex-wrap items-center">
          {/* Status multi-select filter */}
          <div className="relative">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface-variant hover:bg-surface-variant/20 select-none">
                <span>
                  {filterStatuses.size === 0
                    ? "All Status"
                    : filterStatuses.size === 1
                      ? statusConfig[Array.from(filterStatuses)[0]]?.label ?? "1 selected"
                      : `${filterStatuses.size} selected`}
                </span>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
              </summary>
              <div className="absolute z-20 mt-1 w-56 bg-surface border border-outline-variant/40 rounded-xl shadow-lg py-1 overflow-hidden">
                {/* "All" option */}
                <button
                  onClick={() => setFilterStatuses(new Set())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterStatuses.size === 0 ? "bg-primary border-primary" : "border-outline-variant"}`}>
                    {filterStatuses.size === 0 && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  All
                </button>
                {Object.entries(statusConfig).map(([statusKey, config]) => (
                  <button
                    key={statusKey}
                    onClick={() => toggleStatus(statusKey)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterStatuses.has(statusKey) ? "bg-primary border-primary" : "border-outline-variant"}`}>
                      {filterStatuses.has(statusKey) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {config.label}
                  </button>
                ))}
                {filterStatuses.size > 0 && (
                  <div className="border-t border-outline-variant/30 mt-1 pt-1">
                    <button onClick={() => setFilterStatuses(new Set())} className="w-full px-3 py-1.5 text-xs text-primary hover:bg-primary-container/20 text-left">
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Milestone multi-select filter */}
          <div className="relative">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface-variant hover:bg-surface-variant/20 select-none">
                <span>
                  {filterMilestones.size === 0
                    ? "All Milestones"
                    : filterMilestones.size === 1
                      ? (milestones.find(m => filterMilestones.has(m.id))?.name ?? (filterMilestones.has("none") ? "No Milestone" : "1 selected"))
                      : `${filterMilestones.size} milestones`}
                </span>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
              </summary>
              <div className="absolute z-20 mt-1 w-56 bg-surface border border-outline-variant/40 rounded-xl shadow-lg py-1 overflow-hidden">
                {/* "No Milestone" option */}
                <button
                  onClick={() => toggleMilestone("none")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterMilestones.has("none") ? "bg-primary border-primary" : "border-outline-variant"}`}>
                    {filterMilestones.has("none") && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  No Milestone
                </button>
                {milestones.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMilestone(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterMilestones.has(m.id) ? "bg-primary border-primary" : "border-outline-variant"}`}>
                      {filterMilestones.has(m.id) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {m.name}
                  </button>
                ))}
                {filterMilestones.size > 0 && (
                  <div className="border-t border-outline-variant/30 mt-1 pt-1">
                    <button onClick={() => setFilterMilestones(new Set())} className="w-full px-3 py-1.5 text-xs text-primary hover:bg-primary-container/20 text-left">
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Category multi-select filter */}
          <div className="relative">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface-variant hover:bg-surface-variant/20 select-none">
                <span>
                  {filterCategories.size === 0
                    ? "All Categories"
                    : filterCategories.size === 1
                      ? (categories.find(c => filterCategories.has(c.id))?.name ?? "1 selected")
                      : `${filterCategories.size} selected`}
                </span>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
              </summary>
              <div className="absolute z-20 mt-1 w-56 bg-surface border border-outline-variant/40 rounded-xl shadow-lg py-1 overflow-hidden">
                {/* "All" option */}
                <button
                  onClick={() => setFilterCategories(new Set())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterCategories.size === 0 ? "bg-primary border-primary" : "border-outline-variant"}`}>
                    {filterCategories.size === 0 && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterCategories.has(cat.id) ? "bg-primary border-primary" : "border-outline-variant"}`}>
                      {filterCategories.has(cat.id) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {cat.name}
                  </button>
                ))}
                {filterCategories.size > 0 && (
                  <div className="border-t border-outline-variant/30 mt-1 pt-1">
                    <button onClick={() => setFilterCategories(new Set())} className="w-full px-3 py-1.5 text-xs text-primary hover:bg-primary-container/20 text-left">
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Date Range Filter */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary/20"
              title="From Date"
            />
            <span className="text-on-surface-variant">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface focus:ring-2 focus:ring-primary/20"
              title="To Date"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate("") }}
                className="px-2 py-1.5 text-xs text-primary hover:bg-primary-container/20 rounded"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
            {selectedIds.size > 0 && Array.from(selectedIds).every(id => expenses.find(e => e.id === id)?.status === "APPROVED") && (
              <Button onClick={handleBulkPublish} disabled={isPublishing} className="bg-primary hover:bg-primary">
                 {isPublishing ? "Publishing..." : `Publish Selected (${selectedIds.size})`}
              </Button>
            )}
            <Button onClick={downloadReport} disabled={isExporting || filteredExpenses.length === 0} variant="outline">
               <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Export Report"}
            </Button>
            <Button onClick={openAddForm} className="bg-primary hover:bg-primary">
               <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
         </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Milestone</TableHead>
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
                        <TableCell className="text-sm">{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-on-surface">
                           <button onClick={() => { setDetailExpenseId(expense.id); setDetailExpense(expense) }} className="hover:text-primary hover:underline text-left">
                             {expense.title}
                           </button>
                        </TableCell>
                        <TableCell className="text-sm text-on-surface-variant">{expense.category?.name}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant">
                          {expense.milestone
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-container/20 text-on-primary-container border border-primary-container/30">{expense.milestone.name}</span>
                            : <span className="text-on-surface-variant">—</span>}
                        </TableCell>
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
                               <Button
                                 size="sm"
                                 onClick={() => handlePublishOne(expense.id)}
                                 disabled={publishingId === expense.id}
                                 className="bg-primary hover:bg-primary"
                               >
                                  {publishingId === expense.id ? "Publishing..." : "Publish"}
                               </Button>
                             )}
                             <Button variant="ghost" size="icon" onClick={() => { setDetailExpenseId(expense.id); setDetailExpense(expense) }} className="hover:text-on-primary-container hover:bg-primary-container/20 w-8 h-8 rounded-full" title="View Details">
                               <Eye className="w-4 h-4" />
                             </Button>
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
         onSave={handleExpenseSaved}
         milestones={milestones}
         categories={categories}
         expense={editingExpense}
      />

      <ExpenseDetailModal
         projectId={projectId}
         expenseId={detailExpenseId}
         milestones={milestones}
         categories={categories}
         onClose={() => setDetailExpenseId(null)}
         onDeleted={(id) => { setExpenses(prev => prev.filter(e => e.id !== id)); setDetailExpenseId(null) }}
         onUpdated={(updated) => setExpenses(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))}
      />
    </div>
  )
}
