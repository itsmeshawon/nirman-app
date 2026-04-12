import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PUT(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    const { grace_days, penalty_type, fixed_amount, percent_rate, daily_rate, cap } = body
    
    // Upsert penalty config
    const { error } = await supabase.from("penalty_configs").upsert({
      project_id: projectId,
      grace_days: grace_days ? parseInt( grace_days) : 0,
      penalty_type: penalty_type || "NONE",
      fixed_amount: fixed_amount ? parseFloat(fixed_amount) : null,
      percent_rate: percent_rate ? parseFloat(percent_rate) : null,
      daily_rate: daily_rate ? parseFloat(daily_rate) : null,
      cap: cap ? parseFloat(cap) : null
    }, { onConflict: "project_id" })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_PENALTY_CONFIG",
      entityType: "penalty_config"
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
