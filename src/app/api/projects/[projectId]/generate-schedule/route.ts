import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function POST(
  _request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const admin = getSupabaseAdmin()

    // 1. Get or create a single payment_schedules row for this project
    const { data: existingSchedules } = await admin
      .from("payment_schedules")
      .select("id")
      .eq("project_id", projectId)
      .limit(1)

    let scheduleId = existingSchedules?.[0]?.id ?? null
    if (!scheduleId) {
      const { data: newSchedule, error: nsErr } = await admin
        .from("payment_schedules")
        .insert({
          project_id: projectId,
          type: "MIXED",
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString(),
          due_day: 1,
          monthly_amount: 0,
        })
        .select("id")
        .single()
      if (nsErr) return NextResponse.json({ error: nsErr.message }, { status: 400 })
      scheduleId = newSchedule.id
    }

    // 2. Fetch active shareholders with payment models
    const { data: models, error: modelsErr } = await admin
      .from("shareholder_payment_models")
      .select("*, shareholder:shareholders!inner(id, status)")
      .eq("project_id", projectId)
      .eq("shareholder.status", "ACTIVE")

    if (modelsErr) return NextResponse.json({ error: modelsErr.message }, { status: 400 })
    if (!models || models.length === 0) {
      return NextResponse.json({ success: true, message: "No active shareholders with payment models found.", generated: 0 }, { status: 200 })
    }

    // 3. Fetch milestones (for milestone-based generation)
    const { data: milestones } = await admin
      .from("milestones")
      .select("id, name, status")
      .eq("project_id", projectId)
      .in("status", ["UPCOMING", "IN_PROGRESS"])

    // 4. Fetch existing schedule items to avoid duplicates
    const { data: existingItems } = await admin
      .from("schedule_items")
      .select("id, shareholder_id, due_date, milestone_id")
      .eq("schedule_id", scheduleId)

    const existingSet = new Set(
      (existingItems ?? []).map((i: any) => `${i.shareholder_id}__${i.due_date?.slice(0, 10)}`)
    )
    const existingMilestoneSet = new Set(
      (existingItems ?? [])
        .filter((i: any) => i.milestone_id)
        .map((i: any) => `${i.shareholder_id}__${i.milestone_id}`)
    )

    const now = new Date()
    const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // today + 30 calendar days
    const itemsToInsert: any[] = []

    for (const model of models) {
      const shareholderId = model.shareholder_id

      // Monthly items — only generate items whose due_date falls within the next 30 calendar days
      if (model.monthly_enabled && model.monthly_amount && model.monthly_due_day) {
        for (let i = 0; i < 3; i++) { // check up to 3 months to cover the 30-day window
          const dueDate = new Date(now.getFullYear(), now.getMonth() + i, model.monthly_due_day)
          if (dueDate > cutoff) break // past the 30-day window — stop
          const dueDateStr = dueDate.toISOString().slice(0, 10)
          const key = `${shareholderId}__${dueDateStr}`
          if (existingSet.has(key)) continue

          existingSet.add(key)
          const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
          const status = daysDiff < 0 ? "OVERDUE" : daysDiff <= 7 ? "DUE" : "UPCOMING"

          itemsToInsert.push({
            schedule_id: scheduleId,
            shareholder_id: shareholderId,
            amount: model.monthly_amount,
            due_date: dueDate.toISOString(),
            status,
            milestone_id: null,
          })
        }
      }

      // Milestone-based items — skip if no amount is defined (never generate ৳0 items)
      if (model.milestone_based_enabled && model.milestone_amount && model.milestone_amount > 0 && milestones && milestones.length > 0) {
        for (const milestone of milestones) {
          const key = `${shareholderId}__${milestone.id}`
          if (existingMilestoneSet.has(key)) continue

          existingMilestoneSet.add(key)
          itemsToInsert.push({
            schedule_id: scheduleId,
            shareholder_id: shareholderId,
            amount: model.milestone_amount,
            due_date: now.toISOString(),
            status: "UPCOMING",
            milestone_id: milestone.id,
          })
        }
      }
    }

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ success: true, message: "All schedule items already exist. Nothing new to generate.", generated: 0 }, { status: 200 })
    }

    const { error: insertErr } = await admin.from("schedule_items").insert(itemsToInsert)
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "GENERATE_SCHEDULE",
      entityType: "payment_schedule",
      entityId: scheduleId,
      details: { generated: itemsToInsert.length, shareholders: models.length },
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({
      success: true,
      message: `Generated ${itemsToInsert.length} new schedule item${itemsToInsert.length !== 1 ? "s" : ""}.`,
      generated: itemsToInsert.length,
    }, { status: 200 })

  } catch (err) {
    console.error("generate-schedule error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
