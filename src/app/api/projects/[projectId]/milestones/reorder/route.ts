import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PATCH(
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

    const { items } = await request.json()
    // items should be an array of { id, sort_order }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    // Since Supabase doesn't have a simple bulk update for arbitrary columns natively exposed in standard js client without RPC,
    // and we only have a few milestones, we do them sequentially or in parallel promises.
    const updates = items.map(async (item: any) => {
       return supabase
        .from("milestones")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id)
        .eq("project_id", projectId)
    })

    await Promise.all(updates)

    // Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "REORDER_MILESTONES",
      entityType: "milestones",
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Milestones Reorder err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
