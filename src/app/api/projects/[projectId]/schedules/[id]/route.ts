import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string, id: string }> }
) {
  const { projectId, id } = await props.params

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
    const { amount, due_date, milestone_id } = body

    const updatePayload: Record<string, any> = {
      milestone_id: milestone_id === "none" ? null : (milestone_id || undefined)
    }
    if (amount) updatePayload.amount = parseFloat(amount)
    if (due_date) updatePayload.due_date = due_date

    const effectiveDate = due_date || undefined

    if (amount || due_date) {
      const { data: currentItem } = await supabase
        .from("schedule_items")
        .select("amount, due_date, schedule_id")
        .eq("id", id)
        .single()

      if (currentItem) {
        const finalAmount = amount ? parseFloat(amount) : parseFloat(currentItem.amount)
        const finalDueDate = due_date || currentItem.due_date

        const { data: payments } = await supabase
          .from("payments")
          .select("amount")
          .eq("schedule_item_id", id)

        const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0

        let newStatus: string
        if (totalPaid <= 0) {
          const daysDiff = (new Date(finalDueDate).getTime() - Date.now()) / (1000 * 3600 * 24)
          newStatus = daysDiff < 0 ? "OVERDUE" : daysDiff <= 7 ? "DUE" : "UPCOMING"
        } else if (totalPaid >= finalAmount) {
          newStatus = "PAID"
        } else {
          newStatus = "PARTIALLY_PAID"
        }

        updatePayload.status = newStatus
      }
    }

    const { data: updatedItem, error } = await supabase
      .from("schedule_items")
      .update(updatePayload)
      .eq("id", id)
      .select(`
        *,
        shareholder:shareholders(id, unit_flat, profiles(name, email, phone)),
        milestone:milestones(id, name),
        penalties(*)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_SCHEDULE_ITEM",
      entityType: "schedule_items",
      entityId: id,
      details: body
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true, item: updatedItem })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ projectId: string, id: string }> }
) {
  const { projectId, id } = await props.params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [adminResult, paymentsResult] = await Promise.all([
      supabase
        .from("project_admins")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("payments")
        .select("id", { count: 'exact', head: true })
        .eq("schedule_item_id", id)
    ])

    if (!adminResult.data) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if ((paymentsResult.count ?? 0) > 0) {
      return NextResponse.json({ error: "Cannot delete items with recorded payments. Delete payments first." }, { status: 400 })
    }

    await Promise.all([
      supabase
        .from("payment_proofs")
        .update({ schedule_item_id: null })
        .eq("schedule_item_id", id),
      supabase
        .from("penalties")
        .delete()
        .eq("schedule_item_id", id)
    ])

    const { error } = await supabase
      .from("schedule_items")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    logAction({
      projectId,
      userId: user.id,
      action: "DELETE_SCHEDULE_ITEM",
      entityType: "schedule_items",
      entityId: id
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
