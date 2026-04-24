import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin, requireCommitteeMember } from "@/lib/permissions"
import { logAction } from "@/lib/audit"
import { createNotificationsForMany } from "@/lib/notifications"

export async function GET(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params
  const { projectId } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")

    // Determine role to filter by status
    const { data: adminRow } = await supabase
      .from("project_admins")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single()

    const isAdmin = !!adminRow

    let query = getSupabaseAdmin()
      .from("activity_posts")
      .select(`
        id,
        project_id,
        author_id,
        title,
        description,
        media_url,
        media_type,
        tags,
        milestone_id,
        status,
        hidden_at,
        hidden_by_id,
        created_at,
        updated_at,
        profiles!activity_posts_author_id_fkey ( id, name ),
        reactions ( type ),
        post_views ( id )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (!isAdmin) {
      query = query.eq("status", "PUBLISHED")
    }

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data: posts, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Aggregate reactions per type and view count
    const formatted = (posts || []).map((post: any) => {
      const reactionCounts: Record<string, number> = {}
      for (const r of post.reactions || []) {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1
      }
      return {
        ...post,
        reactions: undefined,
        post_views: undefined,
        reaction_counts: reactionCounts,
        view_count: post.post_views?.length || 0,
        author_name: post.profiles?.full_name || null,
      }
    })

    const nextCursor = formatted.length === 20
      ? formatted[formatted.length - 1].created_at
      : null

    return NextResponse.json({ posts: formatted, nextCursor }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params
  const { projectId } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isAdmin = await requireProjectAdmin(supabase, projectId).catch(() => null)
    const isCommittee = isAdmin ? null : await requireCommitteeMember(supabase, projectId).catch(() => null)
    if (!isAdmin && !isCommittee) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    
    // Server-side validation with Zod
    const { postSchema } = await import("@/lib/validations")
    const validated = postSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validated.error.issues[0]?.message
      }, { status: 400 })
    }

    const { title, description, media_url, media_type, tags, milestone_id } = validated.data

    const { data: inserted, error: insertError } = await getSupabaseAdmin()
      .from("activity_posts")
      .insert({
        project_id: projectId,
        author_id: user.id,
        title: title || null,
        description,
        media_url: media_url || null,
        media_type: media_type || null,
        tags: tags || null,
        milestone_id: milestone_id || null,
        status: "PUBLISHED",
      })
      .select("id")
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    // Re-fetch with author join so the client can display correct initials immediately
    const { data: post } = await getSupabaseAdmin()
      .from("activity_posts")
      .select("*, author:profiles!author_id(id, name), milestone:milestones!milestone_id(name)")
      .eq("id", inserted.id)
      .single()

    await logAction({
      projectId,
      userId: user.id,
      action: "CREATE_POST",
      entityType: "activity_post",
      entityId: post.id,
      details: { title, description: description.slice(0, 100) },
    })

    // Notify all active shareholders
    try {
      const { data: shareholders } = await getSupabaseAdmin()
        .from("shareholders")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("status", "ACTIVE")

      const userIds = (shareholders || []).map((s: any) => s.user_id).filter(Boolean)

      await createNotificationsForMany(userIds, {
        projectId,
        type: "ACTIVITY_POST",
        title: "New project update",
        body: description.slice(0, 100),
        linkUrl: "/my/feed",
      })
    } catch (notifErr) {
      console.error("[notifications] Failed to notify shareholders:", notifErr)
    }

    return NextResponse.json({ post }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
