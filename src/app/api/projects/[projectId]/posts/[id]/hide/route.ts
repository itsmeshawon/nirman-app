import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"
import { logAction } from "@/lib/audit"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { projectId, id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Get current status
    const { data: post, error: fetchError } = await supabase
      .from("activity_posts")
      .select("status")
      .eq("id", id)
      .eq("project_id", projectId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const isHiding = post.status === "PUBLISHED"
    const updates: Record<string, any> = {
      status: isHiding ? "HIDDEN" : "PUBLISHED",
      updated_at: new Date().toISOString(),
    }

    if (isHiding) {
      updates.hidden_at = new Date().toISOString()
      updates.hidden_by_id = user.id
    } else {
      updates.hidden_at = null
      updates.hidden_by_id = null
    }

    const { data: updated, error: updateError } = await supabase
      .from("activity_posts")
      .update(updates)
      .eq("id", id)
      .eq("project_id", projectId)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: isHiding ? "HIDE_POST" : "UNHIDE_POST",
      entityType: "activity_post",
      entityId: id,
      details: { newStatus: updates.status },
    })

    return NextResponse.json({ post: updated }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
