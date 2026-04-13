import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { toast } from "sonner"

export function AllPaymentsTab({ projectId, payments }: { projectId: string, payments: any[] }) {

  const handleDownloadReceipt = (paymentId: string) => {
    window.open(`/${projectId}/payments/${paymentId}/receipt`, "_blank")
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
       <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
         <h3 className="text-lg font-semibold text-gray-900">Payment Ledger</h3>
         <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
         </Button>
       </div>

       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Recorded</TableHead>
              <TableHead>Receipt #</TableHead>
              <TableHead>Shareholder</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount (৳)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-8 text-gray-500">No payments recorded yet.</TableCell>
               </TableRow>
            ) : (
               payments.map((p) => (
                 <TableRow key={p.id}>
                    <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-gray-700">{p.receipt_no}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{p.shareholder?.profiles?.name}</div>
                      <div className="text-xs text-gray-500">Unit: {p.shareholder?.unit_flat}</div>
                    </TableCell>
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
  )
}
