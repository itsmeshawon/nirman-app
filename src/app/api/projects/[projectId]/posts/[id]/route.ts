import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"
import { logAction } from "@/lib/audit"

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

    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    const { title, description, tags, milestone_id } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (tags !== undefined) updates.tags = tags
    if (milestone_id !== undefined) updates.milestone_id = milestone_id

    const { data: post, error } = await supabase
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

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
