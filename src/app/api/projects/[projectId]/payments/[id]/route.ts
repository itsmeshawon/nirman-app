import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

/**
 * Re-calculates and updates the status of a schedule item based on its total payments.
 */
async function syncScheduleItemStatus(supabase: any, scheduleItemId: string) {
  if (!scheduleItemId) return

  // 1. Get schedule item details
  const { data: item } = await supabase
    .from("schedule_items")
    .select("amount, due_date")
    .eq("id", scheduleItemId)
    .single()
  
  if (!item) return

  // 2. Get all payments for this item
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("schedule_item_id", scheduleItemId)
  
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0
  const expected = parseFloat(item.amount)

  // 3. Determine new status
  let newStatus = "DUE"
  if (totalPaid <= 0) {
    const isOverdue = new Date(item.due_date) < new Date()
    newStatus = isOverdue ? "OVERDUE" : "DUE"
  } else if (totalPaid >= expected) {
    newStatus = "PAID"
  } else {
    newStatus = "PARTIALLY_PAID"
  }

  // 4. Update
  await supabase
    .from("schedule_items")
    .update({ status: newStatus })
    .eq("id", scheduleItemId)
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string, id: string }> }
) {
  const { projectId, id } = await props.params
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    const { amount, method, reference_no, notes } = body

    // Get old record to check for schedule link
    const { data: oldPayment } = await supabase.from("payments").select("schedule_item_id").eq("id", id).single()

    const { data: updatedPayment, error } = await supabase
      .from("payments")
      .update({
        amount: amount ? parseFloat(amount) : undefined,
        method: method || undefined,
        reference_no: reference_no || undefined,
        notes: notes || undefined
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Sync status if linked
    if (oldPayment?.schedule_item_id) {
        await syncScheduleItemStatus(supabase, oldPayment.schedule_item_id)
    }

    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_PAYMENT",
      entityType: "payment",
      entityId: id,
      details: body
    })

    return NextResponse.json({ success: true, payment: updatedPayment })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ projectId: string, id: string }> }
) {
  const { projectId, id } = await props.params
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Get old record for schedule link sync before deleting
    const { data: payment } = await supabase.from("payments").select("schedule_item_id").eq("id", id).single()

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Sync status if it was linked
    if (payment?.schedule_item_id) {
        await syncScheduleItemStatus(supabase, payment.schedule_item_id)
    }

    await logAction({
      projectId,
      userId: user.id,
      action: "DELETE_PAYMENT",
      entityType: "payment",
      entityId: id
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
