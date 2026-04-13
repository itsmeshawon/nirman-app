import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

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
    const { amount, due_date, status, milestone_id } = body

    const { data: updatedItem, error } = await supabase
      .from("schedule_items")
      .update({
        amount: amount ? parseFloat(amount) : undefined,
        due_date: due_date || undefined,
        status: status || undefined,
        milestone_id: milestone_id === "none" ? null : (milestone_id || undefined)
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_SCHEDULE_ITEM",
      entityType: "schedule_items",
      entityId: id,
      details: body
    })

    return NextResponse.json({ success: true, item: updatedItem })
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

    // Check if there are payments linked
    const { count } = await supabase
        .from("payments")
        .select("*", { count: 'exact', head: true })
        .eq("schedule_item_id", id)
    
    if (count && count > 0) {
        return NextResponse.json({ error: "Cannot delete items with recorded payments. Delete payments first." }, { status: 400 })
    }

    const { error } = await supabase
      .from("schedule_items")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "DELETE_SCHEDULE_ITEM",
      entityType: "schedule_items",
      entityId: id
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
