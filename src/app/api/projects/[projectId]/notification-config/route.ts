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
    const { reminder_days, overdue_reminder, email_enabled, in_app_enabled } = body
    
    // Ensure reminder_days is stored as an array of integers if provided as an array
    const parsedDays = Array.isArray(reminder_days) ? reminder_days.map(d => parseInt(String(d))).filter(n => !isNaN(n)) : []

    const { error } = await supabase.from("notification_configs").upsert({
      project_id: projectId,
      reminder_days: parsedDays,
      overdue_reminder: !!overdue_reminder,
      email_enabled: !!email_enabled,
      in_app_enabled: !!in_app_enabled
    }, { onConflict: "project_id" })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_NOTIFICATION_CONFIG",
      entityType: "notification_config"
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
