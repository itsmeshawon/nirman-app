"use client"

import { useState, useMemo } from "react"
import { PostCard } from "./PostCard"

interface ShareholderFeedClientProps {
  posts: any[]
  userId: string
  projectId: string
  initialReactions: Record<string, string>
  reactionCounts: Record<string, Record<string, number>>
  viewCounts: Record<string, number>
}

type MediaFilter = "all" | "image" | "video" | "audio"

export function ShareholderFeedClient({
  posts,
  userId,
  projectId,
  initialReactions,
  reactionCounts,
  viewCounts,
}: ShareholderFeedClientProps) {
  const [myReactions, setMyReactions] = useState<Record<string, string>>(initialReactions)
  const [reactionCountsState, setReactionCountsState] =
    useState<Record<string, Record<string, number>>>(reactionCounts)
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all")
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all")

  // Collect unique milestones from posts
  const milestones = useMemo(() => {
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
      if (mediaFilter !== "all" && post.media_type !== mediaFilter) return false
      if (milestoneFilter !== "all" && post.milestone_id !== milestoneFilter) return false
      return true
    })
  }, [posts, mediaFilter, milestoneFilter])

  const handleReactionChange = (
    postId: string,
    newReaction: string | null,
    newCounts: Record<string, number>
  ) => {
    setMyReactions((prev) => {
      const next = { ...prev }
      if (newReaction === null) {
        delete next[postId]
      } else {
        next[postId] = newReaction
      }
      return next
    })
    setReactionCountsState((prev) => ({
      ...prev,
      [postId]: newCounts,
    }))
  }

  const mediaFilters: { label: string; value: MediaFilter }[] = [
    { label: "All", value: "all" },
    { label: "Images", value: "image" },
    { label: "Videos", value: "video" },
    { label: "Audio", value: "audio" },
  ]

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {mediaFilters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setMediaFilter(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                mediaFilter === value
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {milestones.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setMilestoneFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                milestoneFilter === "all"
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              All Milestones
            </button>
            {milestones.map(({ id, name }) => (
              <button
                key={id}
                onClick={() => setMilestoneFilter(id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  milestoneFilter === id
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
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
          <p className="text-gray-500 font-medium">No updates yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Your project team will post construction progress here.
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
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
