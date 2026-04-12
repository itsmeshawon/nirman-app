import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    const { type, monthly_amount, due_day, start_date, end_date } = body
    
    // Convert MONTHLY, MILESTONE strings to uppercase just in case
    const dbType = String(type).toUpperCase()

    // 2. We typically want 1 active schedule per project unless supporting multiple active. Let's just upsert or get the first one for simplicity, or we can just insert a new one and maybe mark old as inactive (if table supported that). Since table is `payment_schedules`, let's check for an existing one and update, else insert.
    const { data: existing } = await supabase
      .from("payment_schedules")
      .select("id")
      .eq("project_id", projectId)
      .limit(1)
      .single()

    let resultError;
    if (existing) {
       const { error } = await supabase.from("payment_schedules").update({
          type: dbType,
          monthly_amount: monthly_amount ? parseFloat(monthly_amount) : null,
          due_day: due_day ? parseInt(due_day) : null,
          start_date: start_date || null,
          end_date: end_date || null,
          updated_at: new Date().toISOString()
       }).eq("id", existing.id)
       resultError = error
    } else {
       const { error } = await supabase.from("payment_schedules").insert({
          project_id: projectId,
          type: dbType,
          monthly_amount: monthly_amount ? parseFloat(monthly_amount) : null,
          due_day: due_day ? parseInt(due_day) : null,
          start_date: start_date || null,
          end_date: end_date || null
       })
       resultError = error
    }

    if (resultError) {
      return NextResponse.json({ error: resultError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_PAYMENT_SCHEDULE",
      entityType: "payment_schedule",
      details: { type: dbType }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
