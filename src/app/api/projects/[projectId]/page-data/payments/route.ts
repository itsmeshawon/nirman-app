import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
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

  const { data: projectShareholders } = await supabase.from("shareholders").select("id, unit_flat, profiles(name)").eq("project_id", projectId)
  const shareholderIds = (projectShareholders || []).map((s: any) => s.id)
  const safeSh = shareholderIds.length ? shareholderIds : ["00000000-0000-0000-0000-000000000000"]

  const [{ data: scheduleItems }, { data: payments }, { data: milestones }, { data: paymentProofs }] = await Promise.all([
    supabase.from("schedule_items").select("*, shareholder:shareholders(id, unit_flat, profiles(name, email, phone)), milestone:milestones(id, name), penalties(*)").in("schedule_id", safe).order("due_date", { ascending: true }),
    supabase.from("payments").select("*, shareholder:shareholders(id, unit_flat, profiles(name)), recorded_by:profiles!recorded_by_id(name), schedule_item:schedule_items(milestone:milestones(name)), proof:payment_proofs(attachment_url, attachment_name)").in("shareholder_id", safeSh).order("created_at", { ascending: false }),
    supabase.from("milestones").select("id, name").eq("project_id", projectId).order("sort_order", { ascending: true }),
    getSupabaseAdmin().from("payment_proofs").select("*, shareholder:shareholders(id, unit_flat, profiles(name, email, phone)), schedule_item:schedule_items(id, amount, due_date, milestone:milestones(name))").eq("project_id", projectId).order("submitted_at", { ascending: false }),
  ])

  return NextResponse.json({
    scheduleItems: scheduleItems || [],
    payments: payments || [],
    shareholders: projectShareholders || [],
    milestones: milestones || [],
    paymentProofs: paymentProofs || [],
  })
}
