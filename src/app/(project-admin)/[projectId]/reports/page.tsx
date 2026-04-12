import { createClient } from "@/lib/supabase/server"
import { ReportsClient } from "./ReportsClient"

export const dynamic = "force-dynamic"

export default async function ReportsPage(props: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await props.params
  const supabase = await createClient()

  // Financial summary
  const { data: schedules } = await supabase.from("payment_schedules").select("id").eq("project_id", projectId)
  const scheduleIds = schedules?.map((s: any) => s.id) || []

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("amount, status, milestone_id")
    .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])

  const totalScheduled = scheduleItems?.reduce((s: number, i: any) => s + (i.amount || 0), 0) || 0
  const totalPaid = scheduleItems?.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + (i.amount || 0), 0) || 0

  const { data: publishedExpenses } = await supabase
    .from("expenses")
    .select("amount, vat_amount, milestone_id")
    .eq("project_id", projectId)
    .eq("status", "PUBLISHED")
  const totalExpenses = publishedExpenses?.reduce((s: number, e: any) => s + (e.amount || 0) + (e.vat_amount || 0), 0) || 0
  const collectionRate = totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0

  // Chart data: group by milestone
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, name")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  const chartData = (milestones || []).map((m: any) => {
    const mItems = scheduleItems?.filter((i: any) => i.milestone_id === m.id) || []
    const mExpenses = publishedExpenses?.filter((e: any) => e.milestone_id === m.id) || []
    const collected = mItems.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + (i.amount || 0), 0)
    const expenses = mExpenses.reduce((s: number, e: any) => s + (e.amount || 0) + (e.vat_amount || 0), 0)
    // Only include milestones with some data
    if (collected === 0 && expenses === 0) return null
    return { name: m.name.length > 14 ? m.name.slice(0, 14) + "…" : m.name, collected, expenses }
  }).filter(Boolean)

  return (
    <ReportsClient
      projectId={projectId}
      chartData={chartData as any}
      summary={{ totalScheduled, totalPaid, totalExpenses, collectionRate }}
    />
  )
}
