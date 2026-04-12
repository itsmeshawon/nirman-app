"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"
import { Eye, EyeOff, Edit2, X, Check, Tag } from "lucide-react"

interface AdminPostCardProps {
  post: any
  projectId: string
  onHide: (id: string, status: string) => void
  onEdit: (post: any) => void
}

const PREDEFINED_TAGS = [
  "Progress Update",
  "Material Delivery",
  "Site Update",
  "Foundation",
  "Safety",
  "Inspection",
]

export function AdminPostCard({ post, projectId, onHide, onEdit }: AdminPostCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState(post.title || "")
  const [editDesc, setEditDesc] = useState(post.description || "")
  const [editTags, setEditTags] = useState<string[]>(post.tags || [])
  const [customTagInput, setCustomTagInput] = useState("")

  const supabase = createClient()

  const mediaUrl = post.media_url
    ? supabase.storage.from("activity-media").getPublicUrl(post.media_url).data.publicUrl
    : null

  const handleHideToggle = async () => {
    setIsToggling(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/posts/${post.id}/hide`, {
        method: "PATCH",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update post visibility.")

      const newStatus = data.post.status
      onHide(post.id, newStatus)
      toast.success(newStatus === "HIDDEN" ? "Post hidden from shareholders." : "Post is now visible to shareholders.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsToggling(false)
    }
  }

  const openEdit = () => {
    setEditTitle(post.title || "")
    setEditDesc(post.description || "")
    setEditTags(post.tags || [])
    setIsEditing(true)
  }

  const toggleEditTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags((prev) => [...prev, trimmed])
    }
    setCustomTagInput("")
  }

  const handleSaveEdit = async () => {
    if (!editDesc.trim() || editDesc.trim().length < 5) {
      toast.error("Description must be at least 5 characters.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          description: editDesc.trim(),
          tags: editTags.length > 0 ? editTags : null,
          milestone_id: post.milestone_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save changes.")

      onEdit(data.post)
      setIsEditing(false)
      toast.success("Post updated.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const rc = post.reactionCounts || { LIKE: 0, LOVE: 0, APPRECIATE: 0 }
  const viewCount = post.view_count || 0
  const isHidden = post.status === "HIDDEN"

  return (
    <div className={`relative bg-white rounded-xl border shadow-sm overflow-hidden ${isHidden ? "opacity-75" : ""}`}>
      {/* Hidden overlay badge */}
      {isHidden && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-3 left-3">
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">
              Hidden
            </span>
          </div>
        </div>
      )}

      {/* Action buttons (top-right) */}
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        {!isEditing && (
          <>
            <button
              onClick={openEdit}
              className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-teal-700 hover:border-teal-300 transition-colors shadow-sm"
              title="Edit post"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleHideToggle}
              disabled={isToggling}
              className={`w-7 h-7 rounded-full bg-white border flex items-center justify-center transition-colors shadow-sm ${
                isHidden
                  ? "border-teal-300 text-teal-600 hover:bg-teal-50"
                  : "border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300"
              }`}
              title={isHidden ? "Unhide post" : "Hide post"}
            >
              {isHidden ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Media */}
      {mediaUrl && !isEditing && (
        <div className="w-full">
          {post.media_type === "image" && (
            <img
              src={mediaUrl}
              alt={post.title || "Post media"}
              className="w-full max-h-72 object-cover rounded-t-xl"
            />
          )}
          {post.media_type === "video" && (
            <video controls className="w-full rounded-t-xl bg-black max-h-72">
              <source src={mediaUrl} />
            </video>
          )}
          {post.media_type === "audio" && (
            <div className="px-5 pt-4">
              <audio controls className="w-full">
                <source src={mediaUrl} />
              </audio>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Edit Overlay */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Title (optional)</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Post title"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleEditTag(tag)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      editTags.includes(tag)
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomTag()
                    }
                  }}
                  placeholder="Custom tag + Enter"
                  className="h-7 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomTag}
                  className="h-7 px-2"
                >
                  <Tag className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="text-gray-500"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="bg-teal-700 hover:bg-teal-800 text-white"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Milestone */}
            {post.milestone?.name && (
              <div className="mb-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                  {post.milestone.name}
                </span>
              </div>
            )}

            {/* Title */}
            {post.title && (
              <h3 className="text-base font-bold text-gray-900 leading-snug">
                {post.title}
              </h3>
            )}

            {/* Description */}
            <p className="text-sm text-gray-700 mt-1 line-clamp-3 leading-relaxed">
              {post.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold">
                  {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-700">
                    {post.author?.name || "Admin"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatDateTime(post.created_at)}
                  </span>
                </div>
              </div>

              {/* View count */}
              <span className="text-xs text-gray-400">
                👁 {viewCount}
              </span>
            </div>

            {/* Reactions */}
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-gray-500">👍 {rc.LIKE}</span>
              <span className="text-xs text-gray-500">❤️ {rc.LOVE}</span>
              <span className="text-xs text-gray-500">👏 {rc.APPRECIATE}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
