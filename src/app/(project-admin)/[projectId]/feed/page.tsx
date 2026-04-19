import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { FeedClient } from "./FeedClient"

export const dynamic = "force-dynamic"

export default async function FeedPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params
  const { projectId } = params

  const supabase = await createClient()

  // 1. Current user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch all posts (admin sees all statuses)
  const { data: posts, error: postsError } = await getSupabaseAdmin()
    .from("activity_posts")
    .select("*, author:profiles!author_id(name), milestone:milestones!milestone_id(name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(30)

  if (postsError) console.error("[FeedPage] Fetch posts error:", postsError)

  const allPosts = posts || []

  // 3. Fetch reaction counts for all posts in one query
  const postIds = allPosts.map((p: any) => p.id)

  let reactionRows: any[] = []
  if (postIds.length > 0) {
    const { data } = await supabase
      .from("reactions")
      .select("post_id, reaction_type")
      .in("post_id", postIds)
    reactionRows = data || []
  }

  // Aggregate reaction counts per post
  const reactionCountsMap: Record<string, Record<string, number>> = {}
  for (const row of reactionRows) {
    if (!reactionCountsMap[row.post_id]) {
      reactionCountsMap[row.post_id] = { LIKE: 0, LOVE: 0, APPRECIATE: 0 }
    }
    reactionCountsMap[row.post_id][row.reaction_type] =
      (reactionCountsMap[row.post_id][row.reaction_type] || 0) + 1
  }

  // Attach reactionCounts to each post
  const postsWithCounts = allPosts.map((post: any) => ({
    ...post,
    reactionCounts: reactionCountsMap[post.id] || { LIKE: 0, LOVE: 0, APPRECIATE: 0 },
  }))

  // 4. Milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, name")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <FeedClient
        projectId={projectId}
        initialPosts={postsWithCounts}
        milestones={milestones || []}
        userId={user?.id || ""}
      />
    </div>
  )
}
