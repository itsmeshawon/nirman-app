"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText, FileDown } from "lucide-react"
import { toast } from "sonner"

interface ShareholderPaymentsClientProps {
  scheduleItems: any[]
  payments: any[]
  shareholder: any
}

export function ShareholderPaymentsClient({ scheduleItems, payments, shareholder }: ShareholderPaymentsClientProps) {
  const [activeTab, setActiveTab] = useState("SCHEDULE")

  const totalScheduled = scheduleItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalPaid = payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalDue = totalScheduled - totalPaid

  let totalPenalties = 0
  scheduleItems.forEach(item => {
    if (item.penalties && Array.isArray(item.penalties)) {
      item.penalties.forEach((p: any) => {
        if (!p.is_waived) totalPenalties += (parseFloat(p.amount) || 0)
      })
    }
  })

  // Next Payment Due
  const upcomingItems = scheduleItems.filter(s => s.status === 'DUE' || s.status === 'UPCOMING').sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const nextPayment = upcomingItems[0]

  const formatBD = (num: number) => num.toLocaleString('en-IN')

  const statusConfig: Record<string, string> = {
    UPCOMING: "bg-gray-100 text-gray-700",
    DUE: "bg-blue-100 text-blue-700",
    OVERDUE: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800"
  }

  const handleDownloadReceipt = (paymentId: string) => {
    // Assuming shareholder route prefix, but we need the project ID. It's inside shareholder object.
    window.open(`/${shareholder.project_id}/payments/${paymentId}/receipt`, "_blank")
  }

  return (
    <div className="space-y-8">
       
       <div className="flex justify-between items-end">
           <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Payments</h1>
              <p className="text-gray-500">Track your financial obligations for Unit: {shareholder.unit_flat}</p>
           </div>
           <Button onClick={() => window.open("/my/payments/statement", "_blank")} variant="outline" className="text-[#4F46E5] border-[#4F46E5] hover:bg-indigo-50">
               <FileDown className="w-4 h-4 mr-2" /> Download Full Statement
           </Button>
       </div>

       {/* Summary Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-[1.25rem] p-5 bg-white shadow-eos-sm">
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Total Paid</p>
             <p className="text-2xl font-bold text-indigo-700">৳ {formatBD(totalPaid)}</p>
          </div>
          <div className="border rounded-[1.25rem] p-5 bg-white shadow-eos-sm">
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Total Outstanding</p>
             <p className="text-2xl font-bold text-blue-700">৳ {formatBD(totalDue)}</p>
          </div>
          <div className="border rounded-[1.25rem] p-5 bg-white shadow-eos-sm">
             <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Penalty Balance</p>
             <p className="text-2xl font-bold text-red-600">৳ {formatBD(totalPenalties)}</p>
          </div>
          <div className="border rounded-[1.25rem] p-5 bg-orange-50 border-orange-100 shadow-eos-sm">
             <p className="text-xs font-semibold text-orange-800 uppercase tracking-widest mb-2">Next Scheduled Due</p>
             <p className="text-2xl font-bold text-gray-900">
               {nextPayment ? `৳ ${formatBD(parseFloat(nextPayment.amount))}` : "None"}
             </p>
             <p className="text-xs font-medium text-orange-700 mt-1">
               {nextPayment ? `Due ${new Date(nextPayment.due_date).toLocaleDateString()}` : "Fully Paid!"}
             </p>
          </div>
       </div>

       <div className="border-b border-gray-200">
         <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto whitespace-nowrap pb-1">
            <button onClick={() => setActiveTab("SCHEDULE")} className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === "SCHEDULE" ? "border-[#4F46E5] text-[#4F46E5]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
               My Collection Schedule
            </button>
            <button onClick={() => setActiveTab("HISTORY")} className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === "HISTORY" ? "border-[#4F46E5] text-[#4F46E5]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
               My Payment History
            </button>
         </nav>
      </div>

      <div className="animate-in fade-in duration-300">
         {activeTab === "SCHEDULE" && (
            <div className="bg-white border rounded-[1.25rem] shadow-eos-sm overflow-hidden">
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead className="text-right">Expected (৳)</TableHead>
                      <TableHead className="text-right">Paid (৳)</TableHead>
                      <TableHead className="text-right">Penalty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {scheduleItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">No scheduled collections found</TableCell>
                        </TableRow>
                     ) : (
                        scheduleItems.map((item) => {
                          const uiStyle = statusConfig[item.status] || statusConfig.UPCOMING
                          const paid = payments.filter(p => p.schedule_item_id === item.id).reduce((s, p) => s + parseFloat(p.amount), 0)
                          const pen = item.penalties?.filter((p:any) => !p.is_waived).reduce((s:number, p:any) => s + parseFloat(p.amount), 0) || 0
                          const associatedPayment = payments.find(p => p.schedule_item_id === item.id)

                          return (
                            <TableRow key={item.id}>
                               <TableCell className="text-sm font-medium">{new Date(item.due_date).toLocaleDateString()}</TableCell>
                               <TableCell className="text-sm text-gray-500">{item.milestone?.name || 'General'}</TableCell>
                               <TableCell className="text-right font-medium text-gray-900">{parseFloat(item.amount).toLocaleString('en-IN')}</TableCell>
                               <TableCell className="text-right text-sm text-indigo-700">{paid.toLocaleString('en-IN')}</TableCell>
                               <TableCell className="text-right text-sm text-red-600">{pen.toLocaleString('en-IN')}</TableCell>
                               <TableCell>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${uiStyle}`}>
                                     {item.status.replace("_", " ")}
                                  </span>
                               </TableCell>
                               <TableCell className="text-right">
                                  {(paid > 0 && associatedPayment) ? (
                                    <Button variant="ghost" size="icon" onClick={() => handleDownloadReceipt(associatedPayment.id)} className="text-[#4F46E5]">
                                       <Download className="w-4 h-4" />
                                    </Button>
                                  ) : "-"}
                               </TableCell>
                            </TableRow>
                          )
                        })
                     )}
                  </TableBody>
               </Table>
            </div>
         )}

         {activeTab === "HISTORY" && (
            <div className="bg-white border rounded-[1.25rem] shadow-eos-sm overflow-hidden">
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Recorded</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount (৳)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">No payments recorded yet.</TableCell>
                        </TableRow>
                     ) : (
                        payments.map((p) => (
                          <TableRow key={p.id}>
                             <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                             <TableCell className="font-mono text-xs font-semibold text-gray-700">{p.receipt_no}</TableCell>
                             <TableCell className="text-sm">{p.method.replace("_", " ")}</TableCell>
                             <TableCell className="text-sm text-gray-500 font-mono text-xs">{p.reference_no || "N/A"}</TableCell>
                             <TableCell className="text-right font-medium text-indigo-700">{parseFloat(p.amount).toLocaleString('en-IN')}</TableCell>
                             <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(p.id)} className="text-[#4F46E5] hover:text-indigo-800 hover:bg-indigo-50">
                                   <FileText className="w-4 h-4 mr-2" /> Receipt
                                </Button>
                             </TableCell>
                          </TableRow>
                        ))
                     )}
                  </TableBody>
               </Table>
            </div>
         )}
      </div>

    </div>
  )
}
