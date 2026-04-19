import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
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
  const { data: shareholder } = await supabaseAdmin
    .from("shareholders")
    .select("*, project:projects(id, name, status, address, expected_handover)")
    .eq("user_id", user.id)
    .single()

  if (!shareholder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Building2 className="w-12 h-12 text-outline-variant mb-4" />
        <h2 className="text-lg font-semibold text-on-surface">No Project Assigned</h2>
        <p className="text-outline mt-2 text-sm">You have not been mapped to any project yet. Contact your project admin.</p>
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
        <div className="bg-primary-container/30 border border-primary-container rounded-[1.25rem] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container/50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-primary-container">Your profile is incomplete.</p>
              <p className="text-xs text-primary">Please provide your profession and present address.</p>
            </div>
          </div>
          <Link
            href="/my/profile"
            className="text-sm font-semibold px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            Update Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Due"
          value={formatBDT(totalDue)}
          sub={`${scheduleItems?.filter(i => i.status === "PAID").length || 0} of ${scheduleItems?.length || 0} paid`}
          icon={<CreditCard className="w-6 h-6 text-primary" />}
          bg="bg-primary-container/20"
          accent="border-outline-variant/40"
        />
        <SummaryCard
          label="Overdue"
          value={formatBDT(totalOverdue)}
          sub={`${scheduleItems?.filter(i => i.status === "OVERDUE").length || 0} installment(s)`}
          icon={<AlertCircle className="w-6 h-6 text-primary" />}
          bg="bg-primary-container/20"
          accent="border-outline-variant/40"
        />
        <SummaryCard
          label="Active Penalties"
          value={formatBDT(activePenaltiesTotal)}
          sub={`${penalties?.length || 0} active fine(s)`}
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
          bg="bg-primary-container/20"
          accent="border-outline-variant/40"
        />
        <SummaryCard
          label="Next Installment"
          value={nextDue ? formatBDT(nextDue.amount) : "—"}
          sub={nextDue ? formatDate(nextDue.due_date) : "No upcoming dues"}
          icon={<CalendarClock className="w-6 h-6 text-primary" />}
          bg="bg-primary-container/20"
          accent="border-outline-variant/40"
        />
      </div>

      {/* Next Due Banner */}
      {nextDue && (
        <div className={`rounded-[1.25rem] p-4 flex items-center justify-between border ${totalOverdue > 0 ? "bg-error-container/20 border-error-container" : "bg-tertiary-container/20 border-amber-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalOverdue > 0 ? "bg-error-container/50" : "bg-tertiary-container/40"}`}>
              <Clock className={`w-5 h-5 ${totalOverdue > 0 ? "text-destructive" : "text-tertiary"}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${totalOverdue > 0 ? "text-on-error-container" : "text-on-tertiary-container"}`}>
                {totalOverdue > 0 ? `${formatBDT(totalOverdue)} overdue!` : `Next due: ${formatDate(nextDue.due_date)}`}
              </p>
              <p className={`text-xs ${totalOverdue > 0 ? "text-destructive" : "text-tertiary"}`}>
                {nextDue.milestone?.name} — {formatBDT(nextDue.amount)}
              </p>
            </div>
          </div>
          <Link
            href="/my/payments"
            className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 ${totalOverdue > 0 ? "bg-red-600 text-white hover:bg-red-700" : "bg-tertiary-container/200 text-white hover:bg-amber-600"}`}
          >
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="rounded-[1.25rem] border border-outline-variant/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
            <h3 className="text-sm font-semibold text-on-surface">Recent Payments</h3>
            <Link href="/my/payments" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {payments && payments.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {payments.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{p.method || "Payment"}</p>
                      <p className="text-xs text-outline">{formatDate(p.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatBDT(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-outline">No payments recorded yet.</div>
          )}
        </div>

        {/* Recent Published Expenses */}
        <div className="rounded-[1.25rem] border border-outline-variant/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
            <h3 className="text-sm font-semibold text-on-surface">Project Expenses (Published)</h3>
            <Link href="/my/expenses" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentExpenses && recentExpenses.length > 0 ? (
            <ul className="divide-y divide-outline-variant/30">
              {recentExpenses.map((e: any) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface truncate max-w-[200px]">{e.title}</p>
                    <p className="text-xs text-outline">{e.category?.name} · {formatDate(e.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">{formatBDT((e.amount || 0) + (e.vat_amount || 0))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-outline">No published expenses yet.</div>
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
    <div className={`rounded-2xl border ${accent} bg-surface-container/20 p-5 transition-all duration-300 group cursor-default`}>
      <div className={`w-12 h-12 rounded-[1.25rem] ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-on-surface leading-tight tracking-tight">{value}</p>
      <p className="text-xs text-on-surface-variant mt-1 font-medium">{sub}</p>
    </div>
  )
}
