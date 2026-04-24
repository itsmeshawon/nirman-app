"use client"

import { useState, useMemo } from "react"
import { PostCard } from "./PostCard"
import { CreatePostForm } from "../../../(project-admin)/[projectId]/feed/CreatePostForm"

interface ShareholderFeedClientProps {
  posts: any[]
  userId: string
  userName: string
  projectId: string
  initialReactions: Record<string, string>
  reactionCounts: Record<string, Record<string, number>>
  viewCounts: Record<string, number>
  isCommitteeMember: boolean
  milestones: any[]
}

type MediaFilter = "all" | "image" | "video" | "audio"

export function ShareholderFeedClient({
  posts: initialPosts,
  userId,
  projectId,
  initialReactions,
  reactionCounts,
  viewCounts,
  isCommitteeMember,
  milestones,
}: ShareholderFeedClientProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [myReactions, setMyReactions] = useState<Record<string, string>>(initialReactions)
  const [reactionCountsState, setReactionCountsState] =
    useState<Record<string, Record<string, number>>>(reactionCounts)
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all")
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all")

  const milestonesFromPosts = useMemo(() => {
    const seen = new Map<string, string>()
    for (const post of posts) {
      if (post.milestone_id && post.milestone?.name) {
        seen.set(post.milestone_id, post.milestone.name)
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (mediaFilter !== "all" && post.media_type !== mediaFilter.toUpperCase()) return false
      if (milestoneFilter !== "all" && post.milestone_id !== milestoneFilter) return false
      return true
    })
  }, [posts, mediaFilter, milestoneFilter])

  const handleNewPost = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handleEdit = (updatedPost: any) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p)))
  }

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handleHide = (postId: string, newStatus: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)))
  }

  const handleReactionChange = (
    postId: string,
    newReaction: string | null,
    newCounts: Record<string, number>
  ) => {
    setMyReactions((prev) => {
      const next = { ...prev }
      if (newReaction === null) delete next[postId]
      else next[postId] = newReaction
      return next
    })
    setReactionCountsState((prev) => ({ ...prev, [postId]: newCounts }))
  }

  const mediaFilters: { label: string; value: MediaFilter }[] = [
    { label: "All", value: "all" },
    { label: "Images", value: "image" },
    { label: "Videos", value: "video" },
    { label: "Audio", value: "audio" },
  ]

  return (
    <div>
      {/* Post composer — committee members only */}
      {isCommitteeMember && (
        <div className="mb-5">
          <CreatePostForm
            projectId={projectId}
            milestones={milestones}
            userId={userId}
            onSuccess={handleNewPost}
          />
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {mediaFilters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setMediaFilter(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                mediaFilter === value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-on-surface-variant border-outline-variant/40 hover:border-primary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {milestonesFromPosts.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setMilestoneFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                milestoneFilter === "all"
                  ? "bg-on-surface text-white border-on-surface"
                  : "bg-surface text-on-surface-variant border-outline-variant/40 hover:border-outline"
              }`}
            >
              All Milestones
            </button>
            {milestonesFromPosts.map(({ id, name }) => (
              <button
                key={id}
                onClick={() => setMilestoneFilter(id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  milestoneFilter === id
                    ? "bg-on-surface text-white border-on-surface"
                    : "bg-surface text-on-surface-variant border-outline-variant/40 hover:border-outline"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-3xl mb-3">🏗️</p>
          <p className="text-on-surface-variant font-medium">No updates yet.</p>
          <p className="text-outline text-sm mt-1">
            {isCommitteeMember
              ? "Share the first project update with shareholders."
              : "Your project team will post construction progress here."}
          </p>
        </div>
      ) : (
        <div>
          {filteredPosts.map((post) => {
            const raw = reactionCountsState[post.id] || {}
            const postReactionCounts = {
              LIKE: (raw as any).LIKE || 0,
              LOVE: (raw as any).LOVE || 0,
              APPRECIATE: (raw as any).APPRECIATE || 0,
            }
            // Committee member can manage only their own posts
            const canManage = isCommitteeMember && post.author_id === userId
            return (
              <PostCard
                key={post.id}
                post={post}
                userId={userId}
                projectId={projectId}
                myReaction={myReactions[post.id] || null}
                reactionCounts={postReactionCounts}
                viewCount={viewCounts[post.id] || 0}
                onReactionChange={handleReactionChange}
                canManage={canManage}
                onHide={canManage ? handleHide : undefined}
                onEdit={canManage ? handleEdit : undefined}
                onDelete={canManage ? handleDelete : undefined}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
