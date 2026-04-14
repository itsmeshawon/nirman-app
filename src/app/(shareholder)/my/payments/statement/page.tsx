import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function StatementPrintPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: shareholder } = await supabase.from("shareholders").select("*, projects(name)").eq("user_id", user.id).single()
  if (!shareholder) return notFound()

  // 1. Fetch Dues
  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("*, milestone:milestones(name), penalties(*)")
    .eq("shareholder_id", shareholder.id)
    .order("due_date", { ascending: true })

  // 2. Fetch Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("shareholder_id", shareholder.id)
    .order("created_at", { ascending: true })

  const items = scheduleItems || []
  const py = payments || []

  const totalScheduled = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalPaid = py.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const totalDue = totalScheduled - totalPaid

  let totalPenalties = 0
  items.forEach(item => {
    if (item.penalties) {
      item.penalties.forEach((p:any) => {
        if (!p.is_waived) totalPenalties += (parseFloat(p.amount) || 0)
      })
    }
  })

  // We map a unified ledger logic joining items and payments chronologically
  // But for MVP HTML template, we'll just show two tables.

  return (
    <div className="bg-surface-variant/50 min-h-screen p-8 flex justify-center font-sans">
       <div className="bg-surface p-10 shadow-lg border rounded w-full max-w-3xl print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
          
          <div className="flex justify-between items-start border-b-2 border-on-surface pb-6 mb-6">
             <div>
                <h1 className="text-3xl font-black tracking-tight text-on-surface uppercase">Financial Statement</h1>
                <p className="text-on-surface-variant font-medium text-sm mt-1">{shareholder.projects?.name || "NirmaN Project"}</p>
             </div>
             <div className="text-right">
                <p className="font-mono text-sm font-semibold text-on-surface">Date: {new Date().toLocaleDateString()}</p>
             </div>
          </div>

          <div className="mb-8">
             <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Prepared For</p>
             <p className="font-bold text-on-surface text-lg">Unit: {shareholder.unit_flat}</p>
             <p className="text-sm text-on-surface-variant">Shareholder ID: {shareholder.id.slice(0,8).toUpperCase()}</p>
          </div>

          {/* Core Outline */}
          <div className="grid grid-cols-4 gap-4 mb-8">
             <div className="border p-4 bg-surface-variant/20">
               <p className="text-xs font-semibold text-on-surface-variant uppercase">Total Scheduled</p>
               <p className="font-bold text-on-surface text-lg">৳ {totalScheduled.toLocaleString('en-IN')}</p>
             </div>
             <div className="border p-4 bg-surface-variant/20">
               <p className="text-xs font-semibold text-on-surface-variant uppercase">Total Paid</p>
               <p className="font-bold text-primary text-lg">৳ {totalPaid.toLocaleString('en-IN')}</p>
             </div>
             <div className="border p-4 bg-surface-variant/20">
               <p className="text-xs font-semibold text-on-surface-variant uppercase">Penalties</p>
               <p className="font-bold text-destructive text-lg">৳ {totalPenalties.toLocaleString('en-IN')}</p>
             </div>
             <div className="border p-4 bg-on-surface text-center">
               <p className="text-xs font-semibold text-outline-variant uppercase">Balance Due</p>
               <p className="font-bold text-white text-xl">৳ {(totalDue + totalPenalties).toLocaleString('en-IN')}</p>
             </div>
          </div>

          {/* Dues Schedule */}
          <div className="mb-10">
             <h3 className="text-sm font-bold text-on-surface uppercase border-b pb-2 mb-4">Obligation Schedule</h3>
             <table className="w-full text-left border-collapse text-sm">
                <thead>
                   <tr className="border-b border-outline-variant">
                      <th className="py-2 font-semibold text-on-surface">Date Due</th>
                      <th className="py-2 font-semibold text-on-surface">Milestone</th>
                      <th className="py-2 font-semibold text-on-surface text-right">Expected (৳)</th>
                   </tr>
                </thead>
                <tbody>
                   {items.map(item => (
                     <tr key={item.id} className="border-b border-outline-variant/30">
                        <td className="py-2 text-on-surface-variant">{new Date(item.due_date).toLocaleDateString()}</td>
                        <td className="py-2 text-on-surface-variant">{item.milestone?.name || "General"}</td>
                        <td className="py-2 text-right font-medium text-on-surface">{parseFloat(item.amount).toLocaleString('en-IN')}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Payments Schedule */}
          <div className="mb-10">
             <h3 className="text-sm font-bold text-on-surface uppercase border-b pb-2 mb-4">Payments Applied</h3>
             <table className="w-full text-left border-collapse text-sm">
                <thead>
                   <tr className="border-b border-outline-variant">
                      <th className="py-2 font-semibold text-on-surface">Receipt #</th>
                      <th className="py-2 font-semibold text-on-surface">Date Recorded</th>
                      <th className="py-2 font-semibold text-on-surface">Method</th>
                      <th className="py-2 font-semibold text-on-surface text-right">Amount (৳)</th>
                   </tr>
                </thead>
                <tbody>
                   {py.length === 0 && (
                     <tr><td colSpan={4} className="py-4 text-outline italic">No payments recorded.</td></tr>
                   )}
                   {py.map(p => (
                     <tr key={p.id} className="border-b border-outline-variant/30">
                        <td className="py-2 font-mono text-on-surface-variant">{p.receipt_no}</td>
                        <td className="py-2 text-on-surface-variant">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="py-2 text-on-surface-variant">{p.method.replace("_", " ")}</td>
                        <td className="py-2 text-right font-medium text-primary">{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="text-xs text-center text-outline mt-16 border-t pt-4">
             End of Statement.
          </div>

       </div>
       <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
    </div>
  )
}
