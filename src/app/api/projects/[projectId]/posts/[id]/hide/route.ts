import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"
import { logAction } from "@/lib/audit"

export async function PATCH(
  _request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { projectId, id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Allow project admin OR the post's own author
    const isAdmin = await requireProjectAdmin(supabase, projectId).catch(() => null)

    const { data: post, error: fetchError } = await getSupabaseAdmin()
      .from("activity_posts")
      .select("status, author_id")
      .eq("id", id)
      .eq("project_id", projectId)
      .single()

    if (fetchError || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    if (!isAdmin && post.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

    const { data: updated, error: updateError } = await getSupabaseAdmin()
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

  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
