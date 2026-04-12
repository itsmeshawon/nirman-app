import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string, memberId: string }> }
) {
  const params = await props.params;
  const { projectId, memberId } = params;

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

    // 2. Remove (Deactivate) Committee Member
    const { error: updateError } = await supabase
      .from("committee_members")
      .update({ is_active: false })
      .eq("id", memberId)
      .eq("project_id", projectId)

    if (updateError) {
      console.error("Committee member remove error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "REMOVE_COMMITTEE_MEMBER",
      entityType: "committee_member",
      entityId: memberId
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Committee member PATCH err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
