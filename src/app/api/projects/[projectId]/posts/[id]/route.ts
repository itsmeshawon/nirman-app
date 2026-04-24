import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"
import { logAction } from "@/lib/audit"

async function canManagePost(supabase: any, projectId: string, postId: string, userId: string): Promise<boolean> {
  const isAdmin = await requireProjectAdmin(supabase, projectId).catch(() => null)
  if (isAdmin) return true

  const { data: post } = await getSupabaseAdmin()
    .from("activity_posts")
    .select("author_id")
    .eq("id", postId)
    .eq("project_id", projectId)
    .single()

  return post?.author_id === userId
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { projectId, id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const allowed = await canManagePost(supabase, projectId, id, user.id)
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { title, description, tags, milestone_id, media_url, media_type } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (tags !== undefined) updates.tags = tags
    if (milestone_id !== undefined) updates.milestone_id = milestone_id
    if (media_url !== undefined) updates.media_url = media_url
    if (media_type !== undefined) updates.media_type = media_type

    const { data: post, error } = await getSupabaseAdmin()
      .from("activity_posts")
      .update(updates)
      .eq("id", id)
      .eq("project_id", projectId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "EDIT_POST",
      entityType: "activity_post",
      entityId: id,
      details: { title, description, tags, milestone_id },
    })

    return NextResponse.json({ post }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { projectId, id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const allowed = await canManagePost(supabase, projectId, id, user.id)
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: post } = await getSupabaseAdmin()
      .from("activity_posts")
      .select("media_url")
      .eq("id", id)
      .single()

    const { error: deleteError } = await getSupabaseAdmin()
      .from("activity_posts")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 })

    if (post?.media_url) {
      await getSupabaseAdmin().storage.from("activity-media").remove([post.media_url])
    }

    await logAction({
      projectId,
      userId: user.id,
      action: "DELETE_POST",
      entityType: "activity_post",
      entityId: id,
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
