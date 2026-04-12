import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PUT(
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

    const { rule } = await request.json()
    if (!rule || !['MAJORITY', 'ANY_SINGLE'].includes(rule)) {
       return NextResponse.json({ error: "Invalid approval rule" }, { status: 400 })
    }

    // 2. Upsert Approval config
    const { error: upsertError } = await supabase
      .from("approval_configs")
      .upsert(
        { project_id: projectId, rule },
        { onConflict: "project_id" }
      )
    
    if (upsertError) {
      console.error("Approval config upsert error:", upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_APPROVAL_RULE",
      entityType: "approval_config",
      details: { newRule: rule }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Approval rule PUT err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
