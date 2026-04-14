import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/permissions"
import { formatBDT, formatDateTime } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, AlertCircle, Clock,
  CheckCircle, FileText, Users, Banknote,
  ArrowRight, BarChart2, ShieldAlert, CalendarClock,
  RefreshCw, SendHorizontal
} from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ProjectDashboardPage(props: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await props.params
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)

  const { data: project } = await supabase
    .from("projects")
    .select("name, status")
    .eq("id", projectId)
    .single()

  // Direct DB queries
  const { data: schedules } = await supabase.from("payment_schedules").select("id").eq("project_id", projectId)
  const scheduleIds = schedules?.map((s: any) => s.id) || []

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("amount, status")
    .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])

  const totalScheduled = scheduleItems?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  const totalPaid = scheduleItems?.filter((i: any) => i.status === "PAID").reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  const overdueAmount = scheduleItems?.filter((i: any) => i.status === "OVERDUE").reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  const collectionRate = totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0

  const { data: publishedExpenses } = await supabase
    .from("expenses")
    .select("amount, vat_amount")
    .eq("project_id", projectId)
    .eq("status", "PUBLISHED")
  const totalExpenses = publishedExpenses?.reduce((sum: number, e: any) => sum + (e.amount || 0) + (e.vat_amount || 0), 0) || 0

  const { count: pendingApproval } = await supabase.from("expenses").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "SUBMITTED")
  const { count: changesRequested } = await supabase.from("expenses").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "CHANGES_REQUESTED")
  const { count: approvedUnpublished } = await supabase.from("expenses").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "APPROVED")

  const { data: projectShareholders } = await supabase.from("shareholders").select("id").eq("project_id", projectId)
  const shareholderIds = projectShareholders?.map((s: any) => s.id) || []

  const { count: activePenalties } = await supabase
    .from("penalties")
    .select("*", { count: "exact", head: true })
    .in("shareholder_id", shareholderIds.length ? shareholderIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "ACTIVE")

  const today = new Date()
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)
  const { count: upcomingDues } = await supabase
    .from("schedule_items")
    .select("*", { count: "exact", head: true })
    .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "PENDING")
    .gte("due_date", today.toISOString().split("T")[0])
    .lte("due_date", in30Days.toISOString().split("T")[0])

  const { data: recentAudit } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, details, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(8)

  const balance = totalPaid - totalExpenses

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome banner */}
      <div className="rounded-[28px] bg-[#E8DEF8] p-8 text-[#1D192B] border border-[#CAC4D0]/30">
        <p className="text-[12px] font-bold text-[#49454F] uppercase tracking-wider mb-2">Project Admin</p>
        <h2 className="text-[28px] font-normal tracking-tight leading-tight">{project?.name || "Project Dashboard"}</h2>
        <p className="text-[#49454F] mt-2 text-sm font-medium">Welcome back, {profile.name}</p>
        <span className="mt-4 inline-flex items-center rounded-full bg-[#CCE8E4] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
          {project?.status}
        </span>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-4 ml-1">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { 
              href: `/${projectId}/expenses`, 
              icon: FileText, 
              label: "Add Expense", 
              desc: "Log and publish new project costs to the ledger",
              bg: "bg-[#F3EDF7]", 
              iconColor: "text-primary" 
            },
            { 
              href: `/${projectId}/payments`, 
              icon: Banknote, 
              label: "Record Payment", 
              desc: "Quickly post and verify shareholder receipts",
              bg: "bg-[#F3EDF7]", 
              iconColor: "text-secondary" 
            },
            { 
              href: `/${projectId}/shareholders`, 
              icon: Users, 
              label: "Shareholders", 
              desc: "Manage project members and unit allocation",
              bg: "bg-[#F3EDF7]", 
              iconColor: "text-tertiary" 
            },
            { 
              href: `/${projectId}/reports`, 
              icon: BarChart2, 
              label: "Financial Reports", 
              desc: "View detailed analytics and collection trends",
              bg: "bg-[#F3EDF7]", 
              iconColor: "text-primary" 
            },
          ].map(({ href, icon: Icon, label, desc, bg, iconColor }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-start p-6 rounded-[28px] ${bg} hover:ring-2 hover:ring-primary/20 transition-all group`}
            >
              <div className="flex items-start gap-4 w-full">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-outline-variant/30">
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-medium text-on-surface mb-1">{label}</span>
                  <span className="text-sm text-on-surface-variant leading-relaxed opacity-80">{desc}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 1: Financial Health */}
      <div>
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Financial Health</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FinancialCard
            label="Total Collected"
            value={formatBDT(totalPaid)}
            sub={`of ${formatBDT(totalScheduled)} scheduled`}
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            bg="bg-primary-container/20"
            accent="border-primary-container"
          />
          <FinancialCard
            label="Total Expenses"
            value={formatBDT(totalExpenses)}
            sub="published to ledger"
            icon={<Banknote className="w-5 h-5 text-secondary" />}
            bg="bg-secondary-container/20"
            accent="border-purple-200"
          />
          <FinancialCard
            label="Collection Rate"
            value={`${collectionRate}%`}
            sub={overdueAmount > 0 ? `${formatBDT(overdueAmount)} overdue` : "No overdue amounts"}
            icon={<BarChart2 className="w-5 h-5 text-tertiary" />}
            bg="bg-tertiary-container/20"
            accent="border-blue-200"
          />
          <FinancialCard
            label="Net Balance"
            value={formatBDT(Math.abs(balance))}
            sub={balance >= 0 ? "surplus" : "deficit"}
            icon={balance >= 0 ? <TrendingUp className="w-5 h-5 text-primary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
            bg={balance >= 0 ? "bg-primary-container/20" : "bg-error-container/20"}
            accent={balance >= 0 ? "border-green-200" : "border-error-container"}
          />
        </div>
      </div>

      {/* Row 2: Alerts & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Pipeline */}
        <div className="rounded-xl border border-outline-variant/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
            <h3 className="text-sm font-semibold text-on-surface">Expense Pipeline</h3>
            <Link href={`/${projectId}/expenses`} className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            <PipelineRow
              label="Awaiting Review"
              count={pendingApproval || 0}
              icon={<SendHorizontal className="w-4 h-4 text-[#0F766E]" />}
              color="text-[#0F766E]"
              bg="bg-[#CCE8E4]"
            />
            <PipelineRow
              label="Changes Requested"
              count={changesRequested || 0}
              icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
              color="text-orange-600"
              bg="bg-orange-50"
            />
            <PipelineRow
              label="Approved — Unpublished"
              count={approvedUnpublished || 0}
              icon={<CheckCircle className="w-4 h-4 text-green-500" />}
              color="text-primary"
              bg="bg-primary-container/20"
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-outline-variant/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
            <h3 className="text-sm font-semibold text-on-surface">Alerts</h3>
            <Link href={`/${projectId}/payments`} className="text-xs text-primary hover:underline flex items-center gap-1">
              Payments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            <PipelineRow
              label="Active Penalties"
              count={activePenalties || 0}
              icon={<ShieldAlert className="w-4 h-4 text-[#B3261E]" />}
              color="text-[#B3261E]"
              bg="bg-[#F9DEDC]"
            />
            <PipelineRow
              label="Defaulting Installments"
              count={scheduleItems?.filter((i: any) => i.status === "OVERDUE").length || 0}
              icon={<AlertCircle className="w-4 h-4 text-orange-500" />}
              color="text-orange-600"
              bg="bg-orange-50"
            />
            <PipelineRow
              label="Due in Next 30 Days"
              count={upcomingDues || 0}
              icon={<CalendarClock className="w-4 h-4 text-amber-500" />}
              color="text-tertiary"
              bg="bg-tertiary-container/20"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity */}
      <div className="rounded-xl border border-outline-variant/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
          <h3 className="text-sm font-semibold text-on-surface">Recent Activity</h3>
          <Link href={`/${projectId}/feed`} className="text-xs text-primary hover:underline flex items-center gap-1">
            Full Log <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentAudit && recentAudit.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {recentAudit.map((log: any) => (
              <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                <div className="mt-0.5 w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-on-surface truncate">
                    <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
                    {log.entity_type && <span className="text-on-surface-variant"> · {log.entity_type}</span>}
                  </p>
                  <p className="text-xs text-outline mt-0.5">{formatDateTime(log.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-outline">No activity logged yet.</div>
        )}
      </div>

    </div>
  )
}

function FinancialCard({ label, value, sub, icon, bg, accent }: {
  label: string; value: string; sub: string; icon: React.ReactNode; bg: string; accent: string
}) {
  return (
    <div className="rounded-[16px] border border-[#E7E0EC] p-6 transition-all duration-300 group cursor-default">
      <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-[#49454F] uppercase tracking-widest mb-2">{label}</p>
      <p className="text-[24px] font-normal text-[#1D1B20] leading-tight tracking-tight">{value}</p>
      <p className="text-[12px] text-[#49454F] mt-2 font-medium">{sub}</p>
    </div>
  )
}

function PipelineRow({ label, count, icon, color, bg }: {
  label: string; count: number; icon: React.ReactNode; color: string; bg: string
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F2FA] transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[14px] font-medium text-[#1D1B20]">{label}</span>
      </div>
      <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${count > 0 ? `${bg} ${color}` : "bg-[#CAC4D0]/10 text-[#49454F]"}`}>
        {count}
      </span>
    </div>
  )
}
