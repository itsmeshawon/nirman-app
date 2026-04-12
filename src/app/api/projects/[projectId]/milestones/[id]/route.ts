import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string, id: string }> }
) {
  const params = await props.params;
  const { projectId, id } = params;

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

    const { name, target_date, status } = await request.json()

    // 2. Update Milestone
    const { error: updateError } = await supabase
      .from("milestones")
      .update({
        name,
        target_date,
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("project_id", projectId)

    if (updateError) {
      console.error("Milestone update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_MILESTONE",
      entityType: "milestone",
      entityId: id,
      details: { name, status }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Milestone PATCH err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
