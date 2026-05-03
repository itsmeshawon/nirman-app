import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await requireProjectAdmin(supabase, projectId)
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: schedules } = await supabase
    .from("payment_schedules")
    .select("id")
    .eq("project_id", projectId)

  const scheduleIds = schedules?.map((s: any) => s.id) || []
  const safeScheduleIds = scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"]

  const { data: projectShareholders } = await supabase
    .from("shareholders")
    .select("id")
    .eq("project_id", projectId)

  const shareholderIds = projectShareholders?.map((s: any) => s.id) || []
  const safeShareholderIds = shareholderIds.length ? shareholderIds : ["00000000-0000-0000-0000-000000000000"]

  const today = new Date()
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const [
    { data: scheduleItems },
    { data: publishedExpenses },
    { count: pendingApproval },
    { count: changesRequested },
    { count: approvedUnpublished },
    { count: activePenalties },
    { count: upcomingDues },
    { data: recentAudit },
  ] = await Promise.all([
    supabase.from("schedule_items").select("amount, status").in("schedule_id", safeScheduleIds),
    supabase.from("expenses").select("amount, vat_amount").eq("project_id", projectId).eq("status", "PUBLISHED"),
    supabase.from("expenses").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "SUBMITTED"),
    supabase.from("expenses").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "CHANGES_REQUESTED"),
    supabase.from("expenses").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "APPROVED"),
    supabase.from("penalties").select("*", { count: "exact", head: true }).in("shareholder_id", safeShareholderIds).eq("status", "ACTIVE"),
    supabase.from("schedule_items").select("*", { count: "exact", head: true }).in("schedule_id", safeScheduleIds).eq("status", "PENDING").gte("due_date", today.toISOString().split("T")[0]).lte("due_date", in30Days.toISOString().split("T")[0]),
    supabase.from("audit_logs").select("id, action, entity_type, details, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(8),
  ])

  const totalScheduled = scheduleItems?.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  const totalPaid = scheduleItems?.filter((i: any) => i.status === "PAID").reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  const overdueAmount = scheduleItems?.filter((i: any) => i.status === "OVERDUE").reduce((sum: number, i: any) => sum + (i.amount || 0), 0) || 0
  const overdueCount = scheduleItems?.filter((i: any) => i.status === "OVERDUE").length || 0
  const totalExpenses = publishedExpenses?.reduce((sum: number, e: any) => sum + (e.amount || 0) + (e.vat_amount || 0), 0) || 0

  return NextResponse.json({
    totalScheduled,
    totalPaid,
    overdueAmount,
    overdueCount,
    totalExpenses,
    collectionRate: totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0,
    balance: totalPaid - totalExpenses,
    pendingApproval: pendingApproval || 0,
    changesRequested: changesRequested || 0,
    approvedUnpublished: approvedUnpublished || 0,
    activePenalties: activePenalties || 0,
    upcomingDues: upcomingDues || 0,
    recentAudit: recentAudit || [],
  })
}
