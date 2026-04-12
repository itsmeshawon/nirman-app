import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function ScheduleTab({ scheduleItems, payments }: { scheduleItems: any[], payments: any[] }) {
  const [filterStatus, setFilterStatus] = useState("")

  const getPaidAmount = (scheduleId: string) => {
    return payments
      .filter(p => p.schedule_item_id === scheduleId)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const getPenalty = (item: any) => {
    if (!item.penalties) return 0
    return item.penalties
      .filter((p: any) => !p.is_waived)
      .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
  }

  const statusConfig: Record<string, string> = {
    UPCOMING: "bg-gray-100 text-gray-700",
    DUE: "bg-blue-100 text-blue-700",
    OVERDUE: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800"
  }

  const filteredItems = filterStatus 
    ? scheduleItems.filter(item => item.status === filterStatus) 
    : scheduleItems

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
       <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
         <select 
           value={filterStatus}
           onChange={(e) => setFilterStatus(e.target.value)}
           className="border-gray-300 rounded text-sm focus:ring-teal-500 focus:border-teal-500 block p-2 px-3 bg-white"
         >
           <option value="">All Statuses</option>
           <option value="DUE">Due</option>
           <option value="OVERDUE">Overdue</option>
           <option value="UPCOMING">Upcoming</option>
           <option value="PARTIALLY_PAID">Partially Paid</option>
           <option value="PAID">Paid</option>
         </select>
       </div>
       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due Date</TableHead>
              <TableHead>Shareholder</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead className="text-right">Expected (৳)</TableHead>
              <TableHead className="text-right">Paid (৳)</TableHead>
              <TableHead className="text-right">Penalty</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-8 text-gray-500">No scheduled collections found</TableCell>
               </TableRow>
            ) : (
               filteredItems.map(item => {
                 const uiStyle = statusConfig[item.status] || statusConfig.UPCOMING
                 const isOverdue = item.status === 'OVERDUE'
                 return (
                   <TableRow key={item.id} className={isOverdue ? "border-l-4 border-l-red-500" : ""}>
                      <TableCell className="text-sm font-medium">{new Date(item.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">{item.shareholder?.profiles?.name}</div>
                        <div className="text-xs text-gray-500">Unit: {item.shareholder?.unit_flat}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{item.milestone?.name || 'General'}</TableCell>
                      <TableCell className="text-right font-medium text-gray-900">{parseFloat(item.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-sm text-teal-700">{getPaidAmount(item.id).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{getPenalty(item).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                         <span className={`px-2 py-0.5 rounded text-xs font-semibold ${uiStyle}`}>
                            {item.status.replace("_", " ")}
                         </span>
                      </TableCell>
                   </TableRow>
                 )
               })
            )}
          </TableBody>
       </Table>
    </div>
  )
}
