"use client"

import { useState } from "react"
import { Search, Download, CheckCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface ShareholderExpensesClientProps {
  expenses: any[]
  milestones: { id: string; name: string }[]
}

export function ShareholderExpensesClient({ expenses, milestones }: ShareholderExpensesClientProps) {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set())
  const [filterMilestones, setFilterMilestones] = useState<Set<string>>(new Set())
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Derive unique categories across all fetched expenses
  const categoriesMap = new Map()
  expenses.forEach(e => {
    if (e.category) {
      categoriesMap.set(e.category.id, e.category.name)
    }
  })
  const availableCategories = Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name }))

  const toggleCategory = (id: string) => {
    setFilterCategories(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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

  // Filter Logic
  const filteredExpenses = expenses.filter(e => {
    if (searchTerm && !e.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterCategories.size > 0 && !filterCategories.has(e.category?.id)) return false
    if (filterMilestones.size > 0) {
      const milestoneId = e.milestone?.id ?? "none"
      if (!filterMilestones.has(milestoneId)) return false
    }
    if (fromDate) {
      const expenseDate = new Date(e.published_at || e.updated_at)
      const filterFromDate = new Date(fromDate)
      if (expenseDate < filterFromDate) return false
    }
    if (toDate) {
      const expenseDate = new Date(e.published_at || e.updated_at)
      const filterToDate = new Date(toDate)
      filterToDate.setHours(23, 59, 59, 999)
      if (expenseDate > filterToDate) return false
    }
    return true
  })

  // Aggregate stats
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount + (e.vat_amount || 0), 0)

  const downloadReport = () => {
    setIsExporting(true)
    try {
      const dateStr = fromDate || toDate
        ? `${fromDate ? new Date(fromDate).toLocaleDateString() : "Start"} - ${toDate ? new Date(toDate).toLocaleDateString() : "End"}`
        : "All Dates"

      let csvContent = "data:text/csv;charset=utf-8,"
      csvContent += "Expenses Report\n"
      csvContent += `Period: ${dateStr}\n`
      csvContent += `Total Amount: ৳ ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n`
      csvContent += "Published Date,Title,Category,Milestone,Amount\n"

      filteredExpenses.forEach(e => {
        const amount = (e.amount + (e.vat_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })
        csvContent += `"${new Date(e.published_at || e.updated_at).toLocaleDateString()}","${e.title}","${e.category?.name || "N/A"}","${e.milestone?.name || "—"}","${amount}"\n`
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
       
       {/* Summary Card */}
       <div className="rounded-2xl border border-outline-variant/40 bg-surface-container/20 p-5 transition-all duration-300 group cursor-default">
          <div className="w-12 h-12 rounded-[1.25rem] bg-primary-container/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Published Expenses</p>
          <p className="text-2xl font-black text-on-surface leading-tight tracking-tight">৳ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">Transparency guaranteed: All items fully approved.</p>
       </div>

       {/* Search Bar */}
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

       {/* Filters and Export */}
       <div className="flex gap-3 flex-wrap items-center justify-between">
          {/* Category multi-select filter */}
          <div className="relative">
             <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer list-none px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface-variant hover:bg-surface-variant/20 select-none">
                   <span>
                      {filterCategories.size === 0
                         ? "All Categories"
                         : filterCategories.size === 1
                           ? (availableCategories.find(c => filterCategories.has(c.id))?.name ?? "1 selected")
                           : `${filterCategories.size} selected`}
                   </span>
                   <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                </summary>
                <div className="absolute z-20 mt-1 w-56 bg-surface border border-outline-variant/40 rounded-xl shadow-lg py-1 overflow-hidden">
                   <button
                      onClick={() => setFilterCategories(new Set())}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-variant/20 text-on-surface"
                   >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${filterCategories.size === 0 ? "bg-primary border-primary" : "border-outline-variant"}`}>
                         {filterCategories.size === 0 && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      All
                   </button>
                   {availableCategories.map(cat => (
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

          {/* Milestone multi-select filter */}
          {milestones.length > 0 && (
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
          )}

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

          {/* Export Button */}
          <Button onClick={downloadReport} disabled={isExporting || filteredExpenses.length === 0} variant="outline">
            <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Export Report"}
          </Button>
       </div>

       {/* Table */}
       <div className="overflow-x-auto">
         <Table>
            <TableHeader>
              <TableRow className="bg-surface-variant/20/50">
                <TableHead>Published Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead className="text-right">Amount (৳)</TableHead>
                <TableHead className="text-center">Proofs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center text-on-surface-variant">
                      No published expenses found.
                   </TableCell>
                 </TableRow>
              ) : (
                 filteredExpenses.map((expense) => {
                    const totalVat = expense.vat_amount || 0
                    const extAmount = expense.amount + totalVat
                    
                    return (
                      <TableRow key={expense.id} className="cursor-pointer hover:bg-surface-variant/20" onClick={() => setSelectedExpense(expense)}>
                        <TableCell className="text-sm">{new Date(expense.published_at || expense.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-on-surface">{expense.title}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant text-left">{expense.category?.name || "N/A"}</TableCell>
                        <TableCell className="text-sm text-on-surface-variant">
                          {expense.milestone
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-container/20 text-on-primary-container border border-primary-container/30">{expense.milestone.name}</span>
                            : <span className="text-on-surface-variant">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium text-on-surface">{extAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                           <span className="inline-flex items-center text-xs font-medium bg-surface-variant/50 text-on-surface-variant px-2.5 py-0.5 rounded-full">
                              {expense.attachments?.length || 0} files
                           </span>
                        </TableCell>
                      </TableRow>
                    )
                 })
              )}
            </TableBody>
         </Table>
       </div>

       {/* Detail Dialog */}
       <Dialog open={!!selectedExpense} onOpenChange={(open) => { if (!open) setSelectedExpense(null) }}>
          <DialogContent className="sm:max-w-[600px]">
             {selectedExpense && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl">{selectedExpense.title}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-xs text-on-surface-variant uppercase font-semibold">Total Amount</p>
                           <p className="text-lg font-bold text-on-surface">৳ {(selectedExpense.amount + (selectedExpense.vat_amount || 0)).toLocaleString()}</p>
                           {selectedExpense.vat_amount > 0 && <span className="text-xs text-on-surface-variant">(Includes ৳{selectedExpense.vat_amount} VAT)</span>}
                        </div>
                        <div>
                           <p className="text-xs text-on-surface-variant uppercase font-semibold">Date Incurred</p>
                           <p className="font-medium text-on-surface">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                           <p className="text-xs text-on-surface-variant uppercase font-semibold">Category</p>
                           <p className="font-medium text-on-surface">{selectedExpense.category?.name || "General"}</p>
                        </div>
                        {selectedExpense.invoice_no && (
                          <div>
                            <p className="text-xs text-on-surface-variant uppercase font-semibold">Invoice Number</p>
                            <p className="font-medium text-on-surface">{selectedExpense.invoice_no}</p>
                          </div>
                        )}
                     </div>
                     {selectedExpense.notes && (
                        <div className="bg-surface-variant/20 p-4 rounded-lg text-sm text-on-surface">
                          <strong>Notes: </strong>{selectedExpense.notes}
                        </div>
                     )}
                     
                     <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-on-surface mb-3">Verified Proofs</h4>
                        {selectedExpense.attachments && selectedExpense.attachments.length > 0 ? (
                           <div className="grid grid-cols-2 gap-3">
                              {selectedExpense.attachments.map((att: any) => {
                                 const { data: urlData } = supabase.storage.from("expense-proofs").getPublicUrl(att.file_path)
                                 return (
                                    <a key={att.id} href={urlData.publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded border hover:bg-surface-variant/20 hover:border-primary/60 group">
                                       <FileText className="w-5 h-5 text-on-surface-variant group-hover:text-primary" />
                                       <span className="text-sm font-medium truncate flex-1">{att.file_name}</span>
                                       <Download className="w-4 h-4 text-on-surface-variant" />
                                    </a>
                                 )
                              })}
                           </div>
                        ) : (
                           <p className="text-sm text-on-surface-variant italic">No attachments provided.</p>
                        )}
                     </div>
                  </div>
                </>
             )}
          </DialogContent>
       </Dialog>
    </div>
  )
}
