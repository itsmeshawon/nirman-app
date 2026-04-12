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
       <div className="bg-gradient-to-r from-teal-500 to-[#0F766E] rounded-xl shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <p className="text-teal-100 font-medium uppercase tracking-widest text-sm mb-1">Total Published Expenses</p>
            <h2 className="text-4xl font-bold">৳ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-sm text-teal-100 flex items-center mt-3 bg-teal-800/40 w-max px-3 py-1 rounded-full">
               <CheckCircle className="w-4 h-4 mr-2" />
               Transparency guaranteed: All items fully approved.
            </p>
          </div>
          <PieChart className="w-24 h-24 text-white/20 hidden md:block" />
       </div>

       {/* Filters */}
       <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <select 
                 className="pl-9 pr-8 py-2 border rounded-md text-sm border-gray-200 outline-none focus:border-teal-500 bg-transparent appearance-none"
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
       <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
         <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
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
                   <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                      No published expenses found.
                   </TableCell>
                 </TableRow>
              ) : (
                 filteredExpenses.map((expense) => {
                    const totalVat = expense.vat_amount || 0
                    const extAmount = expense.amount + totalVat
                    
                    return (
                      <TableRow key={expense.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedExpense(expense)}>
                        <TableCell className="text-sm">{new Date(expense.published_at || expense.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-gray-900">{expense.title}</TableCell>
                        <TableCell className="text-sm text-gray-500 text-left">{expense.category?.name || "N/A"}</TableCell>
                        <TableCell className="text-right font-medium text-gray-900">{extAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                           <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
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
                           <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
                           <p className="text-lg font-bold text-gray-900">৳ {(selectedExpense.amount + (selectedExpense.vat_amount || 0)).toLocaleString()}</p>
                           {selectedExpense.vat_amount > 0 && <span className="text-xs text-gray-500">(Includes ৳{selectedExpense.vat_amount} VAT)</span>}
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-semibold">Date Incurred</p>
                           <p className="font-medium text-gray-900">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
                           <p className="font-medium text-gray-900">{selectedExpense.category?.name || "General"}</p>
                        </div>
                        {selectedExpense.invoice_no && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Invoice Number</p>
                            <p className="font-medium text-gray-900">{selectedExpense.invoice_no}</p>
                          </div>
                        )}
                     </div>
                     {selectedExpense.notes && (
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                          <strong>Notes: </strong>{selectedExpense.notes}
                        </div>
                     )}
                     
                     <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Verified Proofs</h4>
                        {selectedExpense.attachments && selectedExpense.attachments.length > 0 ? (
                           <div className="grid grid-cols-2 gap-3">
                              {selectedExpense.attachments.map((att: any) => {
                                 const { data: urlData } = supabase.storage.from("expense-proofs").getPublicUrl(att.file_path)
                                 return (
                                    <a key={att.id} href={urlData.publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50 hover:border-teal-400 group">
                                       <FileText className="w-5 h-5 text-gray-400 group-hover:text-teal-600" />
                                       <span className="text-sm font-medium truncate flex-1">{att.file_name}</span>
                                       <Download className="w-4 h-4 text-gray-400" />
                                    </a>
                                 )
                              })}
                           </div>
                        ) : (
                           <p className="text-sm text-gray-500 italic">No attachments provided.</p>
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
