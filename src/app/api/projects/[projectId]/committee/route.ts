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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await requireProjectAdmin(supabase, projectId)
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { shareholder_id, user_id } = await request.json()

    if (!shareholder_id || !user_id) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 2. Add / Reactivate Committee Member (upsert to handle reactivating)
    const { error: insertError } = await supabase
      .from("committee_members")
      .upsert({
        project_id: projectId,
        shareholder_id,
        user_id,
        is_active: true
      }, { onConflict: "project_id,user_id" })

    if (insertError) {
      console.error("Committee member insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "ADD_COMMITTEE_MEMBER",
      entityType: "committee_member",
      details: { shareholder_id }
    })

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (err: any) {
    console.error("Committee member POST err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
