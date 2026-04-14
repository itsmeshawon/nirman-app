"use client"

import { useState } from "react"
import { Search, Download, FileText, CheckCircle, PieChart } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface ShareholderExpensesClientProps {
  expenses: any[]
}

export function ShareholderExpensesClient({ expenses }: ShareholderExpensesClientProps) {
  const supabase = createClient()
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [selectedExpense, setSelectedExpense] = useState<any>(null)

  // Derive unique categories across all fetched expenses
  const categoriesMap = new Map()
  expenses.forEach(e => {
    if (e.category) {
      categoriesMap.set(e.category.id, e.category.name)
    }
  })
  const availableCategories = Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name }))

  // Filter Logic
  const filteredExpenses = expenses.filter(e => {
    if (filterCategory !== "ALL" && e.category?.id !== filterCategory) return false
    return true
  })

  // Aggregate stats
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount + (e.vat_amount || 0), 0)

  return (
    <div className="space-y-6">
       
       {/* Summary Card */}
       <div className="bg-gradient-to-r from-primary/80 to-primary rounded-[1.25rem] shadow-eos overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <p className="text-primary-foreground font-medium uppercase tracking-widest text-sm mb-1">Total Published Expenses</p>
            <h2 className="text-4xl font-bold">৳ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-sm text-primary-foreground flex items-center mt-3 bg-primary/40 w-max px-3 py-1 rounded-full">
               <CheckCircle className="w-4 h-4 mr-2" />
               Transparency guaranteed: All items fully approved.
            </p>
          </div>
          <PieChart className="w-24 h-24 text-white/20 hidden md:block" />
       </div>

       {/* Filters */}
       <div className="flex justify-between items-center bg-surface p-4 rounded-lg border shadow-eos-sm">
          <div className="flex items-center gap-4">
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
               <select 
                 className="pl-9 pr-8 py-2 border rounded-md text-sm border-outline-variant/50 outline-none focus:border-primary bg-transparent appearance-none"
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value)}
               >
                 <option value="ALL">All Categories</option>
                 {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
          </div>
       </div>

       {/* Table */}
       <div className="bg-surface border rounded-[1.25rem] shadow-eos-sm overflow-hidden">
         <Table>
            <TableHeader>
              <TableRow className="bg-surface-variant/20/50">
                <TableHead>Published Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount (৳)</TableHead>
                <TableHead className="text-center">Proofs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="h-32 text-center text-on-surface-variant">
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
                                       <FileText className="w-5 h-5 text-outline group-hover:text-primary" />
                                       <span className="text-sm font-medium truncate flex-1">{att.file_name}</span>
                                       <Download className="w-4 h-4 text-outline" />
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
