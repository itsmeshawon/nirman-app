import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ReceiptPrintPage(props: { params: Promise<{ projectId: string, id: string }> }) {
  const params = await props.params;
  const { projectId, id } = params;

  const supabase = await createClient()

  // Verify access (just check it exists for now)
  const { data: payment } = await supabase
    .from("payments")
    .select(`
      *,
      shareholder:shareholders(unit_flat, profiles(name, phone, email)),
      recorded_by:profiles!recorded_by_id(name),
      schedule_item:schedule_items(milestone:milestones(name))
    `)
    .eq("id", id)
    .single()

  if (!payment) return notFound()

  // Get project info
  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single()

  return (
    <div className="bg-gray-100 min-h-screen p-8 flex justify-center font-sans">
       <div className="bg-white p-10 shadow-lg border rounded w-full max-w-2xl print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
             <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">OFFICIAL RECEIPT</h1>
                <p className="text-gray-500 font-medium text-sm mt-1">{project?.name || "NirmaN Project"}</p>
             </div>
             <div className="text-right">
                <p className="font-mono text-sm font-semibold text-gray-800">No. {payment.receipt_no}</p>
                <p className="text-sm text-gray-500">Date: {new Date(payment.created_at).toLocaleDateString()}</p>
             </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Received From</p>
                <p className="font-bold text-gray-900">{payment.shareholder?.profiles?.name}</p>
                <p className="text-sm text-gray-600">Unit: {payment.shareholder?.unit_flat}</p>
                {payment.shareholder?.profiles?.phone && <p className="text-sm text-gray-600">{payment.shareholder.profiles.phone}</p>}
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                <p className="font-bold text-gray-900">{payment.method.replace("_", " ")}</p>
                {payment.reference_no && <p className="text-sm text-gray-600 mt-1">Ref: {payment.reference_no}</p>}
             </div>
          </div>

          <div className="mb-8">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-gray-300">
                      <th className="py-2 text-sm font-semibold text-gray-800">Description</th>
                      <th className="py-2 text-sm font-semibold text-gray-800 text-right">Amount</th>
                   </tr>
                </thead>
                <tbody>
                   <tr className="border-b border-gray-100">
                      <td className="py-4 text-sm text-gray-600">
                         {payment.schedule_item 
                           ? `Payment towards: ${payment.schedule_item.milestone?.name || 'General Obligation'}`
                           : 'Manual Ad-hoc Payment'
                         }
                         {payment.notes && <div className="text-xs text-gray-400 mt-1">{payment.notes}</div>}
                      </td>
                      <td className="py-4 text-right font-medium text-gray-900">
                         ৳ {parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                   </tr>
                   <tr>
                      <td className="py-4 text-sm font-bold text-gray-900 uppercase text-right">Total Net Amount</td>
                      <td className="py-4 text-right font-bold text-xl text-gray-900 border-t-2 border-gray-800">
                         ৳ {parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* Footer Annotations */}
          <div className="mt-16 pt-8 border-t flex justify-between items-end">
             <div className="text-xs text-gray-500">
                <p>This is a computer-generated receipt.</p>
                <p>Recorded by: {payment.recorded_by?.name}</p>
             </div>
             <div className="text-center w-48">
                <div className="border-b border-gray-400 mb-2 h-8"></div>
                <p className="text-xs text-gray-600 font-medium">Authorized Signature</p>
             </div>
          </div>

       </div>
       
       {/* Auto-print script */}
       <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
    </div>
  )
}
