import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params;
  const { projectId, id } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    const { waive_reason } = body

    if (!waive_reason) {
      return NextResponse.json({ error: "Must provide a reason to waive a penalty" }, { status: 400 })
    }

    // Capture the existing penalty to document the waived amount
    const { data: oldPenalty } = await supabase
      .from("penalties")
      .select("amount")
      .eq("id", id)
      .single()

    if (!oldPenalty) return NextResponse.json({ error: "Penalty not found" }, { status: 404 })

    const { data: penalty, error } = await supabase
      .from("penalties")
      .update({
         is_waived: true,
         waived_amount: oldPenalty.amount,
         amount: 0, // Zero out the visible penalty
         waive_reason,
         waived_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
       projectId,
       userId: user.id,
       action: "WAIVE_PENALTY",
       entityType: "penalty",
       entityId: id,
       details: { waived_amount: oldPenalty.amount, waive_reason }
    })

    return NextResponse.json({ success: true, penalty }, { status: 200 })

  } catch (err: any) {
    console.error("Waive penalty error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
