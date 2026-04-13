"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PostCardProps {
  post: any
  userId: string
  projectId: string
  myReaction: string | null
  reactionCounts: { LIKE: number; LOVE: number; APPRECIATE: number }
  viewCount: number
  onReactionChange: (
    postId: string,
    newReaction: string | null,
    newCounts: { LIKE: number; LOVE: number; APPRECIATE: number }
  ) => void
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "APPRECIATE", emoji: "👏", label: "Appreciate" },
] as const

export function PostCard({
  post,
  userId,
  projectId,
  myReaction: myReactionProp,
  reactionCounts: reactionCountsProp,
  viewCount,
  onReactionChange,
}: PostCardProps) {
  const [myReaction, setMyReaction] = useState<string | null>(myReactionProp)
  const [counts, setCounts] = useState<{ LIKE: number; LOVE: number; APPRECIATE: number }>(
    reactionCountsProp
  )
  const [isReacting, setIsReacting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const viewTracked = useRef(false)

  // Sync prop changes (e.g. when parent re-renders with updated state)
  useEffect(() => {
    setMyReaction(myReactionProp)
    setCounts(reactionCountsProp)
  }, [myReactionProp, reactionCountsProp])

  // IntersectionObserver for view tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTracked.current) {
          viewTracked.current = true
          fetch(`/api/projects/${projectId}/posts/${post.id}/view`, { method: "POST" })
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [projectId, post.id])

  const supabase = createClient()
  const mediaUrl = post.media_url
    ? supabase.storage.from("activity-media").getPublicUrl(post.media_url).data.publicUrl
    : null

  const handleReact = async (reactionType: string) => {
    if (isReacting) return

    // Snapshot for potential revert
    const prevReaction = myReaction
    const prevCounts = { ...counts }

    // Optimistic update
    const isSameType = myReaction === reactionType
    const newCounts = { ...counts }

    if (isSameType) {
      // Toggle off
      newCounts[reactionType as keyof typeof newCounts] = Math.max(
        0,
        newCounts[reactionType as keyof typeof newCounts] - 1
      )
      setMyReaction(null)
      setCounts(newCounts)
      onReactionChange(post.id, null, newCounts)
    } else {
      // Switch or add
      if (myReaction) {
        // Remove old reaction count
        newCounts[myReaction as keyof typeof newCounts] = Math.max(
          0,
          newCounts[myReaction as keyof typeof newCounts] - 1
        )
      }
      newCounts[reactionType as keyof typeof newCounts] += 1
      setMyReaction(reactionType)
      setCounts(newCounts)
      onReactionChange(post.id, reactionType, newCounts)
    }

    setIsReacting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: reactionType }),
      })
      if (!res.ok) throw new Error("Failed to react")
    } catch {
      // Revert on error
      setMyReaction(prevReaction)
      setCounts(prevCounts)
      onReactionChange(post.id, prevReaction, prevCounts)
      toast.error("Could not save your reaction. Please try again.")
    } finally {
      setIsReacting(false)
    }
  }

  const authorInitials = post.author?.name
    ? post.author.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "PA"

  return (
    <>
      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-eos-sm border border-gray-100 mb-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-0 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
            {authorInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {post.author?.name || "Project Admin"}
              </span>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100 font-medium">
                Project Admin
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{relativeTime(post.created_at)}</p>
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <div className="px-4 mt-3">
            <h3 className="text-lg font-semibold text-gray-900 leading-snug">{post.title}</h3>
          </div>
        )}

        {/* Description */}
        <div className="px-4 mt-2">
          <p className="text-sm text-gray-700 leading-relaxed">{post.description}</p>
        </div>

        {/* Media */}
        {mediaUrl && (
          <div className="mt-3">
            {post.media_type === "IMAGE" && (
              <img
                src={mediaUrl}
                alt={post.title || "Post image"}
                loading="lazy"
                className="w-full max-h-96 object-cover cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
            )}
            {post.media_type === "VIDEO" && (
              <video
                controls
                className="w-full rounded-[1.25rem] mx-auto"
                style={{ maxHeight: "24rem" }}
              >
                <source src={mediaUrl} />
                Your browser does not support the video tag.
              </video>
            )}
            {post.media_type === "AUDIO" && (
              <div className="px-4">
                <audio controls className="w-full rounded-[1.25rem]">
                  <source src={mediaUrl} />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="px-4 mt-3 flex gap-1.5 flex-wrap">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Milestone */}
        {post.milestone?.name && (
          <div className="px-4 mt-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              {post.milestone.name}
            </span>
          </div>
        )}

        {/* Reaction bar */}
        <div className="px-4 mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex gap-1">
            {REACTIONS.map(({ type, emoji, label }) => {
              const isActive = myReaction === type
              const count = counts[type as keyof typeof counts]
              return (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  disabled={isReacting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all duration-150 active:scale-110 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
                      : "text-gray-500 border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
                  aria-label={label}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              )
            })}
          </div>

          {/* View count */}
          <span className="text-xs text-gray-400">👁 {viewCount}</span>
        </div>

        {/* Bottom padding */}
        <div className="h-3" />
      </div>

      {/* Image lightbox */}
      {lightboxOpen && mediaUrl && post.media_type === "IMAGE" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={mediaUrl}
            alt={post.title || "Full size"}
            className="max-w-full max-h-full rounded-[1.25rem] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
