import { createClient } from "@/lib/supabase/server"
import { MilestoneTimeline } from "./MilestoneTimeline"

export const dynamic = "force-dynamic"

export default async function MilestonesPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // Fetch milestones
  const { data: milestones, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching milestones:", error)
    return <div>Failed to load milestones</div>
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("milestone_id, amount, vat_amount")
    .eq("project_id", projectId)

  const expenseTotals: Record<string, { total: number; count: number }> = {}
  for (const e of expenses || []) {
    if (!e.milestone_id) continue
    if (!expenseTotals[e.milestone_id]) {
      expenseTotals[e.milestone_id] = { total: 0, count: 0 }
    }
    expenseTotals[e.milestone_id].total += (e.amount || 0) + (e.vat_amount || 0)
    expenseTotals[e.milestone_id].count += 1
  }

  return (
    <div className="w-full">
      <MilestoneTimeline projectId={projectId} initialMilestones={milestones || []} expenseTotals={expenseTotals} />
    </div>
  )
}
