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

  const [{ data: milestones }, { data: expenses }] = await Promise.all([
    supabase.from("milestones").select("*").eq("project_id", projectId).order("sort_order", { ascending: true }),
    supabase.from("expenses").select("milestone_id, amount, vat_amount").eq("project_id", projectId),
  ])

  const expenseTotals: Record<string, { total: number; count: number }> = {}
  for (const e of expenses || []) {
    if (!e.milestone_id) continue
    if (!expenseTotals[e.milestone_id]) expenseTotals[e.milestone_id] = { total: 0, count: 0 }
    expenseTotals[e.milestone_id].total += (e.amount || 0) + (e.vat_amount || 0)
    expenseTotals[e.milestone_id].count += 1
  }

  return NextResponse.json({ milestones: milestones || [], expenseTotals })
}
