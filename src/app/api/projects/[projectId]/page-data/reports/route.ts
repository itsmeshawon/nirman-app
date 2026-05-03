import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try { await requireProjectAdmin(supabase, projectId) } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: schedules } = await supabase.from("payment_schedules").select("id").eq("project_id", projectId)
  const scheduleIds = schedules?.map((s: any) => s.id) || []
  const safe = scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"]

  const [{ data: scheduleItems }, { data: publishedExpenses }, { data: milestones }] = await Promise.all([
    supabase.from("schedule_items").select("amount, status, milestone_id").in("schedule_id", safe),
    supabase.from("expenses").select("amount, vat_amount, milestone_id").eq("project_id", projectId).eq("status", "PUBLISHED"),
    supabase.from("milestones").select("id, name").eq("project_id", projectId).order("sort_order", { ascending: true }),
  ])

  const totalScheduled = (scheduleItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0)
  const totalPaid = (scheduleItems || []).filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + (i.amount || 0), 0)
  const totalExpenses = (publishedExpenses || []).reduce((s: number, e: any) => s + (e.amount || 0) + (e.vat_amount || 0), 0)

  const chartData = (milestones || []).map((m: any) => {
    const mItems = (scheduleItems || []).filter((i: any) => i.milestone_id === m.id)
    const mExpenses = (publishedExpenses || []).filter((e: any) => e.milestone_id === m.id)
    const collected = mItems.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + (i.amount || 0), 0)
    const expenses = mExpenses.reduce((s: number, e: any) => s + (e.amount || 0) + (e.vat_amount || 0), 0)
    if (collected === 0 && expenses === 0) return null
    return { name: m.name.length > 14 ? m.name.slice(0, 14) + "…" : m.name, collected, expenses }
  }).filter(Boolean)

  return NextResponse.json({
    chartData,
    summary: {
      totalScheduled,
      totalPaid,
      totalExpenses,
      collectionRate: totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0,
    },
  })
}
