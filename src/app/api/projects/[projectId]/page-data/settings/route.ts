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

  const [{ data: project }, { data: paySched }, { data: penalty }, { data: notify }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("payment_schedules").select("*").eq("project_id", projectId).single(),
    supabase.from("penalty_configs").select("*").eq("project_id", projectId).single(),
    supabase.from("notification_configs").select("*").eq("project_id", projectId).single(),
  ])

  return NextResponse.json({
    project: project || {},
    paymentSchedule: paySched || {},
    penaltyConfig: penalty || {},
    notificationConfig: notify || {},
  })
}
