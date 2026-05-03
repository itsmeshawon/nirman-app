import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: adminCheck } = await supabase
      .from("project_admins")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single()
    if (!adminCheck) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { shareholder_id, amount, due_date } = body
    const milestone_id = body.milestone_id === "none" ? null : body.milestone_id

    if (!shareholder_id || !amount || !due_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const schedAmount = parseFloat(amount)

    const { data: existingSchedules } = await supabase
      .from("payment_schedules")
      .select("id")
      .eq("project_id", projectId)
      .limit(1)

    let scheduleId = existingSchedules?.[0]?.id ?? null

    if (!scheduleId) {
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

      if (nsErr) return NextResponse.json({ error: nsErr.message }, { status: 400 })
      scheduleId = newSchedule.id
    }

    const dueDateObj = new Date(due_date)
    const now = new Date()
    const daysDiff = (dueDateObj.getTime() - now.getTime()) / (1000 * 3600 * 24)
    const initialStatus = daysDiff < 0 ? "OVERDUE" : daysDiff <= 7 ? "DUE" : "UPCOMING"

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
      .select(`
        *,
        shareholder:shareholders(id, unit_flat, profiles(name, email, phone)),
        milestone:milestones(id, name),
        penalties(*)
      `)
      .single()

    if (siErr) return NextResponse.json({ error: siErr.message }, { status: 400 })

    logAction({
      projectId,
      userId: user.id,
      action: "CREATE_SCHEDULE_ITEM",
      entityType: "schedule_items",
      entityId: scheduleItem.id,
      details: { amount: schedAmount, due_date: scheduleItem.due_date, initialStatus }
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true, scheduleItem }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
