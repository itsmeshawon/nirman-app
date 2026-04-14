import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShareholderFeedClient } from "./ShareholderFeedClient"

export const dynamic = "force-dynamic"

export default async function ShareholderFeedPage() {
  const supabase = await createClient()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 2. Shareholder + project
  const { data: shareholder } = await supabase
    .from("shareholders")
    .select("*, project:projects(id, name)")
    .eq("user_id", user.id)
    .single()

  if (!shareholder || !shareholder.project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <p className="text-2xl mb-3">🏗️</p>
        <h2 className="text-lg font-semibold text-on-surface">No Project Assigned</h2>
        <p className="text-outline text-sm mt-2">
          You have not been mapped to any project yet. Contact your project admin.
        </p>
      </div>
    )
  }

  const projectId: string = shareholder.project.id

  const { supabaseAdmin } = await import("@/lib/supabase/admin")
  
  // 3. Fetch PUBLISHED posts
  const { data: posts, error: postsError } = await supabaseAdmin
    .from("activity_posts")
    .select("*, author:profiles!author_id(name), milestone:milestones!milestone_id(name)")
    .eq("project_id", projectId)
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(20)

  if (postsError) console.error("[ShareholderFeedPage] Fetch posts error:", postsError)

  const allPosts = posts || []
  const postIds = allPosts.map((p: any) => p.id)

  // 4. My reactions
  let myReactions: Record<string, string> = {}
  // 5. All reaction counts
  let reactionCounts: Record<string, Record<string, number>> = {}
  // 6. View counts
  let viewCounts: Record<string, number> = {}

  if (postIds.length > 0) {
    const [myReactionsRes, allReactionsRes, viewsRes] = await Promise.all([
      supabase
        .from("reactions")
        .select("post_id, reaction_type")
        .eq("user_id", user.id)
        .in("post_id", postIds),
      supabase
        .from("reactions")
        .select("post_id, reaction_type")
        .in("post_id", postIds),
      supabase
        .from("post_views")
        .select("post_id")
        .in("post_id", postIds),
    ])

    // Build my reactions map
    for (const row of myReactionsRes.data || []) {
      myReactions[row.post_id] = row.reaction_type
    }

    // Build reaction counts map
    for (const row of allReactionsRes.data || []) {
      if (!reactionCounts[row.post_id]) {
        reactionCounts[row.post_id] = { LIKE: 0, LOVE: 0, APPRECIATE: 0 }
      }
      reactionCounts[row.post_id][row.reaction_type] =
        (reactionCounts[row.post_id][row.reaction_type] || 0) + 1
    }

    // Build view counts map
    for (const row of viewsRes.data || []) {
      viewCounts[row.post_id] = (viewCounts[row.post_id] || 0) + 1
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-on-surface">Activity Feed</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {shareholder.project.name} — latest construction updates
        </p>
      </div>

      <ShareholderFeedClient
        posts={allPosts}
        userId={user.id}
        projectId={projectId}
        initialReactions={myReactions}
        reactionCounts={reactionCounts}
        viewCounts={viewCounts}
      />
    </div>
  )
}
