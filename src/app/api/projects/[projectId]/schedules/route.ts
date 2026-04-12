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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    const { shareholder_id, amount, due_date } = body
    const milestone_id = body.milestone_id === "none" ? null : body.milestone_id

    if (!shareholder_id || !amount || !due_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const schedAmount = parseFloat(amount)

    // Phase 1: Determine or create a parent Schedule record
    let scheduleId = null
    const { data: existingSchedules } = await supabase
      .from("payment_schedules")
      .select("id")
      .eq("project_id", projectId)
      .limit(1)

    if (existingSchedules && existingSchedules.length > 0) {
      scheduleId = existingSchedules[0].id
    } else {
      // Create a default schedule bucket if none exists
      // We use 'MILESTONE' as it is a known valid type in the DB schema
      const { data: newSchedule, error: nsErr } = await supabase
        .from("payment_schedules")
        .insert({
           project_id: projectId,
           type: "MILESTONE",
           start_date: new Date().toISOString(),
           end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString(),
           due_day: 1,
           monthly_amount: 0
        })
        .select()
        .single()

      if (nsErr) {
        console.error("Ad-hoc schedule creation error:", nsErr)
        return NextResponse.json({ error: nsErr.message }, { status: 400 })
      }
      scheduleId = newSchedule.id
    }

    // Phase 2: Calculate generic status
    const dueDateObj = new Date(due_date)
    const now = new Date()
    let initialStatus = dueDateObj < now ? "OVERDUE" : "UPCOMING"
    
    // Slight buffer for "DUE"
    const daysDiff = (dueDateObj.getTime() - now.getTime()) / (1000 * 3600 * 24)
    if (daysDiff >= 0 && daysDiff <= 7) {
       initialStatus = "DUE"
    }

    // Insert Schedule Item
    const { data: scheduleItem, error: siErr } = await supabase
      .from("schedule_items")
      .insert({
         schedule_id: scheduleId,
         shareholder_id,
         milestone_id: milestone_id || null,
         amount: schedAmount,
         due_date: dueDateObj.toISOString(),
         status: initialStatus
      })
      .select()
      .single()

    if (siErr) return NextResponse.json({ error: siErr.message }, { status: 400 })

    // Phase 3: Log Action
    await logAction({
       projectId,
       userId: user.id,
       action: "CREATE_SCHEDULE_ITEM",
       entityType: "schedule_items",
       entityId: scheduleItem.id,
       details: { amount: schedAmount, due_date: scheduleItem.due_date, initialStatus }
    })

    return NextResponse.json({ success: true, scheduleItem }, { status: 200 })

  } catch (err: any) {
    console.error("Schedule creation error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
