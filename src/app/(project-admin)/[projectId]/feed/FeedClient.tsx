"use client"

import { useState } from "react"
import { CreatePostForm } from "./CreatePostForm"
import { AdminPostCard } from "./AdminPostCard"

interface FeedClientProps {
  projectId: string
  initialPosts: any[]
  milestones: any[]
  userId: string
}

type FilterMedia = "image" | "video" | "audio" | null
type FilterStatus = "all" | "hidden"

export function FeedClient({ projectId, initialPosts, milestones, userId }: FeedClientProps) {
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

  const filteredPosts = posts.filter((post) => {
    if (filterStatus === "hidden" && post.status !== "HIDDEN") return false
    if (filterMedia && post.media_type !== filterMedia) return false
    return true
  })

  const mediaFilters: { label: string; value: FilterMedia }[] = [
    { label: "All", value: null },
    { label: "Images", value: "image" },
    { label: "Videos", value: "video" },
    { label: "Audio", value: "audio" },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-sm text-gray-500 mt-1">Share project updates with shareholders.</p>
      </div>

      {/* Create Post Form */}
      <CreatePostForm
        projectId={projectId}
        milestones={milestones}
        userId={userId}
        onSuccess={handleSuccess}
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center pt-2">
        <div className="flex gap-1.5">
          {mediaFilters.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setFilterMedia(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filterMedia === value
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700"
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
                : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
            }`}
          >
            {filterStatus === "hidden" ? "Showing Hidden" : "Show Hidden"}
          </button>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No posts found.</p>
          <p className="text-sm mt-1">
            {filterMedia || filterStatus === "hidden"
              ? "Try changing your filters."
              : "Create the first update above."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <AdminPostCard
              key={post.id}
              post={post}
              projectId={projectId}
              onHide={handleHide}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
