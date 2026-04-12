import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    await requireProjectAdmin(supabase, projectId)

    // -- Payments collected vs scheduled --
    const { data: schedules } = await supabase
      .from("payment_schedules")
      .select("id")
      .eq("project_id", projectId)
    const scheduleIds = schedules?.map(s => s.id) || []

    const { data: scheduleItems } = await supabase
      .from("schedule_items")
      .select("amount, status")
      .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])

    const totalScheduled = scheduleItems?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0
    const totalPaid = scheduleItems
      ?.filter(i => i.status === "PAID")
      .reduce((sum, i) => sum + (i.amount || 0), 0) || 0
    const overdueAmount = scheduleItems
      ?.filter(i => i.status === "OVERDUE")
      .reduce((sum, i) => sum + (i.amount || 0), 0) || 0

    // -- Published expenses total --
    const { data: publishedExpenses } = await supabase
      .from("expenses")
      .select("amount, vat_amount")
      .eq("project_id", projectId)
      .eq("status", "PUBLISHED")

    const totalExpenses = publishedExpenses?.reduce(
      (sum, e) => sum + (e.amount || 0) + (e.vat_amount || 0),
      0
    ) || 0

    // -- Collection rate --
    const collectionRate = totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0

    // -- Pending approval pipeline --
    const { count: pendingApproval } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "SUBMITTED")

    const { count: changesRequested } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "CHANGES_REQUESTED")

    const { count: approvedUnpublished } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "APPROVED")

    // -- Active penalties --
    const { data: projectShareholders } = await supabase
      .from("shareholders")
      .select("id")
      .eq("project_id", projectId)
    const shareholderIds = projectShareholders?.map(s => s.id) || []

    const { count: activePenalties } = await supabase
      .from("penalties")
      .select("*", { count: "exact", head: true })
      .in("shareholder_id", shareholderIds.length ? shareholderIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "ACTIVE")

    const { count: defaultersCount } = await supabase
      .from("schedule_items")
      .select("shareholder_id", { count: "exact", head: true })
      .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "OVERDUE")

    // -- Upcoming dues (next 30 days) --
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

    // -- Recent audit logs --
    const { data: recentAudit } = await supabase
      .from("audit_logs")
      .select("id, action, entity_type, details, created_at, user_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      financial: {
        totalScheduled,
        totalPaid,
        totalExpenses,
        collectionRate,
        overdueAmount,
        balance: totalPaid - totalExpenses
      },
      pipeline: {
        pendingApproval: pendingApproval || 0,
        changesRequested: changesRequested || 0,
        approvedUnpublished: approvedUnpublished || 0
      },
      alerts: {
        activePenalties: activePenalties || 0,
        defaultersCount: defaultersCount || 0,
        upcomingDues: upcomingDues || 0
      },
      recentAudit: recentAudit || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
