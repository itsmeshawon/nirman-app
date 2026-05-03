import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"

async function syncScheduleItemStatus(supabase: any, scheduleItemId: string) {
  if (!scheduleItemId) return

  const { data: item } = await supabase
    .from("schedule_items")
    .select("amount, due_date")
    .eq("id", scheduleItemId)
    .single()
  
  if (!item) return

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("schedule_item_id", scheduleItemId)
  
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0
  const expected = parseFloat(item.amount)

  let newStatus = "DUE"
  if (totalPaid <= 0) {
    const isOverdue = new Date(item.due_date) < new Date()
    newStatus = isOverdue ? "OVERDUE" : "DUE"
  } else if (totalPaid >= expected) {
    newStatus = "PAID"
  } else {
    newStatus = "PARTIALLY_PAID"
  }

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
    const { amount, method, reference_no, notes } = body

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

    if (oldPayment?.schedule_item_id) {
      syncScheduleItemStatus(supabase, oldPayment.schedule_item_id)
    }

    logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_PAYMENT",
      entityType: "payment",
      entityId: id,
      details: body
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true, payment: updatedPayment })
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

    const [adminResult, paymentResult] = await Promise.all([
      supabase
        .from("project_admins")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single(),
      supabase.from("payments").select("schedule_item_id").eq("id", id).single()
    ])

    if (!adminResult.data) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (paymentResult.error) return NextResponse.json({ error: "Payment not found" }, { status: 404 })

    await supabase
      .from("payment_proofs")
      .update({ payment_id: null })
      .eq("payment_id", id)

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (paymentResult.data?.schedule_item_id) {
      syncScheduleItemStatus(supabase, paymentResult.data.schedule_item_id)
    }

    logAction({
      projectId,
      userId: user.id,
      action: "DELETE_PAYMENT",
      entityType: "payment",
      entityId: id
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
