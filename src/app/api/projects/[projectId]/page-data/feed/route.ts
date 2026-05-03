import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try { await requireProjectAdmin(supabase, projectId) } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [{ data: profile }, { data: posts }, { data: milestones }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    getSupabaseAdmin().from("activity_posts").select("*, author:profiles!author_id(name), milestone:milestones!milestone_id(name)").eq("project_id", projectId).order("created_at", { ascending: false }).limit(30),
    supabase.from("milestones").select("id, name").eq("project_id", projectId).order("sort_order", { ascending: true }),
  ])

  const allPosts = posts || []
  const postIds = allPosts.map((p: any) => p.id)

  const [reactionRows, viewRows] = await Promise.all([
    postIds.length ? getSupabaseAdmin().from("reactions").select("post_id, type").in("post_id", postIds).then(r => r.data || []) : Promise.resolve([]),
    postIds.length ? getSupabaseAdmin().from("post_views").select("post_id").in("post_id", postIds).then(r => r.data || []) : Promise.resolve([]),
  ])

  const reactionCountsMap: Record<string, Record<string, number>> = {}
  for (const row of reactionRows as any[]) {
    if (!reactionCountsMap[row.post_id]) reactionCountsMap[row.post_id] = { LIKE: 0, LOVE: 0, MEH: 0, SAD: 0 }
    reactionCountsMap[row.post_id][row.type] = (reactionCountsMap[row.post_id][row.type] || 0) + 1
  }
  const viewCountsMap: Record<string, number> = {}
  for (const row of viewRows as any[]) {
    viewCountsMap[row.post_id] = (viewCountsMap[row.post_id] || 0) + 1
  }

  const postsWithCounts = allPosts.map((post: any) => ({
    ...post,
    reactionCounts: reactionCountsMap[post.id] || { LIKE: 0, LOVE: 0, MEH: 0, SAD: 0 },
    view_count: viewCountsMap[post.id] || 0,
  }))

  return NextResponse.json({
    posts: postsWithCounts,
    milestones: milestones || [],
    userId: user.id,
    userName: profile?.name || "",
  })
}
