import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatBDT, formatDate } from "@/lib/utils"
import {
  CreditCard, TrendingUp, AlertCircle, Clock,
  CheckCircle, ArrowRight, Building2, CalendarClock
} from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ShareholderDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const { data: shareholder } = await supabase
    .from("shareholders")
    .select("*, project:projects(id, name, status, address, expected_handover)")
    .eq("user_id", user.id)
    .single()

  if (!shareholder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Building2 className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">No Project Assigned</h2>
        <p className="text-gray-400 mt-2 text-sm">You have not been mapped to any project yet. Contact your project admin.</p>
      </div>
    )
  }

  // My schedule items
  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("*, milestone:milestones(name)")
    .eq("shareholder_id", shareholder.id)
    .order("due_date", { ascending: true })

  // My payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, created_at, method")
    .eq("shareholder_id", shareholder.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // My active penalties
  const { data: penalties } = await supabase
    .from("penalties")
    .select("id, amount, reason, created_at, status")
    .eq("shareholder_id", shareholder.id)
    .eq("status", "ACTIVE")

  // My published expenses (project level - visible to shareholders)
  const { data: recentExpenses } = await supabase
    .from("expenses")
    .select("id, title, amount, vat_amount, date, category:expense_categories(name)")
    .eq("project_id", shareholder.project?.id)
    .eq("status", "PUBLISHED")
    .order("date", { ascending: false })
    .limit(5)

  // Compute totals
  const totalDue = scheduleItems?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0
  const totalPaid = scheduleItems?.filter(i => i.status === "PAID").reduce((sum, i) => sum + (i.amount || 0), 0) || 0
  const totalOverdue = scheduleItems?.filter(i => i.status === "OVERDUE").reduce((sum, i) => sum + (i.amount || 0), 0) || 0
  const pendingItems = scheduleItems?.filter(i => i.status === "PENDING") || []
  const nextDue = pendingItems[0]
  const activePenaltiesTotal = penalties?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  return (
    <div className="space-y-6 pb-12">

      {/* Incomplete Profile Banner */}
      {(!profile?.profession || !profile?.present_address) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-[1.25rem] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-800">Your profile is incomplete.</p>
              <p className="text-xs text-indigo-600">Please provide your profession and present address.</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-sm font-semibold px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            Update Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      {/* Hero card — banking style */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <p className="text-indigo-100 text-sm mb-1">Welcome back</p>
          <h2 className="text-2xl font-bold">{profile?.name}</h2>
          <p className="text-indigo-200 text-sm mt-1">{shareholder.project?.name} — Unit {shareholder.unit_flat}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <p className="text-indigo-200 text-xs">Ownership</p>
              <p className="text-xl font-semibold">{shareholder.ownership_pct}%</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="text-indigo-200 text-xs">Total Paid</p>
              <p className="text-xl font-semibold">{formatBDT(totalPaid)}</p>
            </div>
            {shareholder.project?.expected_handover && (
              <div className="border-l border-white/20 pl-4">
                <p className="text-indigo-200 text-xs">Expected Handover</p>
                <p className="text-xl font-semibold">{formatDate(shareholder.project.expected_handover)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Due"
          value={formatBDT(totalDue)}
          sub={`${scheduleItems?.filter(i => i.status === "PAID").length || 0} of ${scheduleItems?.length || 0} paid`}
          icon={<CreditCard className="w-6 h-6 text-indigo-600" />}
          bg="bg-indigo-50"
          accent="border-indigo-100"
        />
        <SummaryCard
          label="Overdue"
          value={formatBDT(totalOverdue)}
          sub={`${scheduleItems?.filter(i => i.status === "OVERDUE").length || 0} installment(s)`}
          icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
          bg="bg-rose-50"
          accent={totalOverdue > 0 ? "border-rose-200" : "border-rose-100"}
        />
        <SummaryCard
          label="Active Penalties"
          value={formatBDT(activePenaltiesTotal)}
          sub={`${penalties?.length || 0} active fine(s)`}
          icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
          bg="bg-amber-50"
          accent="border-amber-100"
        />
        <SummaryCard
          label="Next Installment"
          value={nextDue ? formatBDT(nextDue.amount) : "—"}
          sub={nextDue ? formatDate(nextDue.due_date) : "No upcoming dues"}
          icon={<CalendarClock className="w-6 h-6 text-emerald-600" />}
          bg="bg-emerald-50"
          accent="border-emerald-100"
        />
      </div>

      {/* Next Due Banner */}
      {nextDue && (
        <div className={`rounded-[1.25rem] p-4 flex items-center justify-between border ${totalOverdue > 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalOverdue > 0 ? "bg-red-100" : "bg-amber-100"}`}>
              <Clock className={`w-5 h-5 ${totalOverdue > 0 ? "text-red-600" : "text-amber-600"}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${totalOverdue > 0 ? "text-red-800" : "text-amber-800"}`}>
                {totalOverdue > 0 ? `${formatBDT(totalOverdue)} overdue!` : `Next due: ${formatDate(nextDue.due_date)}`}
              </p>
              <p className={`text-xs ${totalOverdue > 0 ? "text-red-600" : "text-amber-600"}`}>
                {nextDue.milestone?.name} — {formatBDT(nextDue.amount)}
              </p>
            </div>
          </div>
          <Link
            href="/my/payments"
            className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 ${totalOverdue > 0 ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-500 text-white hover:bg-amber-600"}`}
          >
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 shadow-eos-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Payments</h3>
            <Link href="/my/payments" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {payments && payments.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {payments.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.method || "Payment"}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-700">{formatBDT(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No payments recorded yet.</div>
          )}
        </div>

        {/* Recent Published Expenses */}
        <div className="bg-white rounded-[1.25rem] border border-gray-200 shadow-eos-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Project Expenses (Published)</h3>
            <Link href="/my/expenses" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentExpenses && recentExpenses.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recentExpenses.map((e: any) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{e.title}</p>
                    <p className="text-xs text-gray-400">{e.category?.name} · {formatDate(e.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{formatBDT((e.amount || 0) + (e.vat_amount || 0))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No published expenses yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, icon, bg, accent }: {
  label: string; value: string; sub: string; icon: React.ReactNode; bg: string; accent: string
}) {
  return (
    <div className={`bg-white rounded-2xl border ${accent} shadow-eos-sm p-5 hover:shadow-eos transition-all duration-300 group cursor-default`}>
      <div className={`w-12 h-12 rounded-[1.25rem] ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{sub}</p>
    </div>
  )
}
