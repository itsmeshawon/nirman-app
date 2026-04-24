import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { ShareholderFeedClient } from "./ShareholderFeedClient"

export const dynamic = "force-dynamic"

export default async function ShareholderFeedPage() {
  const supabase = await createClient()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 2. Shareholder + project
  const { data: shareholder } = await getSupabaseAdmin()
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

  const projectId: string = (shareholder.project as any).id

  // 3. Fetch profile name
  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single()

  // 4. Check if user is a committee member
  const { data: committeeRow } = await getSupabaseAdmin()
    .from("committee_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  const isCommitteeMember = !!committeeRow

  // 4. Fetch posts — committee members see all statuses (their own hidden ones too); others see PUBLISHED only
  let postsQuery = getSupabaseAdmin()
    .from("activity_posts")
    .select("*, author:profiles!author_id(name, id), milestone:milestones!milestone_id(name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(30)

  if (!isCommitteeMember) {
    postsQuery = postsQuery.eq("status", "PUBLISHED")
  }

  const { data: posts, error: postsError } = await postsQuery
  if (postsError) console.error("[ShareholderFeedPage] Fetch posts error:", postsError)

  const allPosts = posts || []
  const postIds = allPosts.map((p: any) => p.id)

  // 5. Reactions + views
  let myReactions: Record<string, string> = {}
  let reactionCounts: Record<string, Record<string, number>> = {}
  let viewCounts: Record<string, number> = {}

  if (postIds.length > 0) {
    const [myReactionsRes, allReactionsRes, viewsRes] = await Promise.all([
      supabase.from("reactions").select("post_id, reaction_type").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("reactions").select("post_id, reaction_type").in("post_id", postIds),
      supabase.from("post_views").select("post_id").in("post_id", postIds),
    ])

    for (const row of myReactionsRes.data || []) {
      myReactions[row.post_id] = row.reaction_type
    }
    for (const row of allReactionsRes.data || []) {
      if (!reactionCounts[row.post_id]) reactionCounts[row.post_id] = { LIKE: 0, LOVE: 0, APPRECIATE: 0 }
      reactionCounts[row.post_id][row.reaction_type] = (reactionCounts[row.post_id][row.reaction_type] || 0) + 1
    }
    for (const row of viewsRes.data || []) {
      viewCounts[row.post_id] = (viewCounts[row.post_id] || 0) + 1
    }
  }

  // 6. Milestones — needed for committee member post creation
  let milestones: any[] = []
  if (isCommitteeMember) {
    const { data: milestonesData } = await supabase
      .from("milestones")
      .select("id, name")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
    milestones = milestonesData || []
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <ShareholderFeedClient
        posts={allPosts}
        userId={user.id}
        userName={profile?.name || ""}
        projectId={projectId}
        initialReactions={myReactions}
        reactionCounts={reactionCounts}
        viewCounts={viewCounts}
        isCommitteeMember={isCommitteeMember}
        milestones={milestones}
      />
    </div>
  )
}
