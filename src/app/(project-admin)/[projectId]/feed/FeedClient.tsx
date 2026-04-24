"use client"

import { useState } from "react"
import { CreatePostForm } from "./CreatePostForm"
import { AdminPostCard } from "./AdminPostCard"
import { EmptyState } from "@/components/EmptyState"
import { Bell as BellIcon } from "lucide-react"

interface FeedClientProps {
  projectId: string
  initialPosts: any[]
  milestones: any[]
  userId: string
  userName: string
}

type FilterMedia = "image" | "video" | "audio" | null
type FilterStatus = "all" | "hidden"

export function FeedClient({ projectId, initialPosts, milestones, userId, userName }: FeedClientProps) {
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [filterMedia, setFilterMedia] = useState<FilterMedia>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")

  const handleSuccess = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handleHide = (postId: string, newStatus: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    )
  }

  const handleEdit = (updatedPost: any) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    )
  }

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const filteredPosts = posts.filter((post) => {
    if (filterStatus === "hidden" && post.status !== "HIDDEN") return false
    if (filterMedia && post.media_type !== filterMedia) return false
    return true
  })

  const mediaFilters: { label: string; value: string | null }[] = [
    { label: "All", value: null },
    { label: "Images", value: "IMAGE" },
    { label: "Videos", value: "VIDEO" },
    { label: "Audio", value: "AUDIO" },
  ]

  return (
    <div className="space-y-4">
      {/* Create Post Form */}
      <CreatePostForm
        projectId={projectId}
        milestones={milestones}
        userId={userId}
        userName={userName}
        onSuccess={handleSuccess}
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center pt-2">
        <div className="flex gap-1.5">
          {mediaFilters.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setFilterMedia(value as FilterMedia)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filterMedia === value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-on-surface-variant border-outline-variant/40 hover:border-primary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setFilterStatus(filterStatus === "hidden" ? "all" : "hidden")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filterStatus === "hidden"
                ? "bg-red-600 text-white border-red-600"
                : "bg-surface text-on-surface-variant border-outline-variant/40 hover:border-red-300 hover:text-destructive"
            }`}
          >
            {filterStatus === "hidden" ? "Showing Hidden" : "Show Hidden"}
          </button>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title={filterMedia || filterStatus === "hidden" ? "No matches found" : "No project updates yet"}
          description={
            filterMedia || filterStatus === "hidden"
              ? "Try adjusting your filters to see more results."
              : "Share construction progress, site photos, or community updates with your shareholders."
          }
          className="bg-surface-variant/20/50"
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <AdminPostCard
              key={post.id}
              post={post}
              projectId={projectId}
              onHide={handleHide}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
