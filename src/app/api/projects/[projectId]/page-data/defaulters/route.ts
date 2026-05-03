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

  const { data: projectShareholders } = await supabase.from("shareholders").select("id").eq("project_id", projectId)
  const shareholderIds = (projectShareholders || []).map((s: any) => s.id)
  const safeSh = shareholderIds.length ? shareholderIds : ["00000000-0000-0000-0000-000000000000"]

  const [{ data: overdueItems }, { data: payments }] = await Promise.all([
    supabase.from("schedule_items").select("*, shareholder:shareholders(*, profiles(name, email, phone)), milestone:milestones(id, name), penalties(*)").in("schedule_id", safe).eq("status", "OVERDUE").order("due_date", { ascending: true }),
    supabase.from("payments").select("*").in("shareholder_id", safeSh),
  ])

  return NextResponse.json({ overdueItems: overdueItems || [], payments: payments || [] })
}
