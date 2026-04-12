import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string, shareholderId: string }> }
) {
  const params = await props.params;
  const { projectId, shareholderId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await requireProjectAdmin(supabase, projectId)
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    // Don't allow changing project_id, user_id from this endpoint
    const { unit_flat, ownership_pct, opening_balance, status } = body

    // 2. Update the shareholder record
    const { error: updateError } = await supabase
      .from("shareholders")
      .update({
        unit_flat,
        ownership_pct: ownership_pct !== undefined ? parseFloat(ownership_pct) : undefined,
        opening_balance: opening_balance !== undefined ? parseFloat(opening_balance) : undefined,
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", shareholderId)
      .eq("project_id", projectId) // ensure it belongs to this project

    if (updateError) {
      console.error("Shareholder update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_SHAREHOLDER",
      entityType: "shareholder",
      entityId: shareholderId,
      details: { unit_flat, status }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Shareholder PATCH err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
