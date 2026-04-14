"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"
import { Eye, EyeOff, Edit2, X, Check, Tag, Trash2, Upload, Music, Video, Image as ImageIcon } from "lucide-react"
import { useCallback, useRef } from "react"

interface AdminPostCardProps {
  post: any
  projectId: string
  onHide: (id: string, status: string) => void
  onEdit: (post: any) => void
  onDelete: (id: string) => void
}

const PREDEFINED_TAGS = [
  "Progress Update",
  "Material Delivery",
  "Site Update",
  "Foundation",
  "Safety",
  "Inspection",
]

function detectMediaType(file: File): "IMAGE" | "VIDEO" | "AUDIO" | null {
  if (file.type.startsWith("image/")) return "IMAGE"
  if (file.type.startsWith("video/")) return "VIDEO"
  if (file.type.startsWith("audio/")) return "AUDIO"
  return null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminPostCard({ post, projectId, onHide, onEdit, onDelete }: AdminPostCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState(post.title || "")
  const [editDesc, setEditDesc] = useState(post.description || "")
  const [editTags, setEditTags] = useState<string[]>(post.tags || [])
  const [customTagInput, setCustomTagInput] = useState("")

  // Media edit state
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaPath, setMediaPath] = useState<string | null>(post.media_url || null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/posts/${post.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete post.")

      onDelete(post.id)
      toast.success("Post deleted.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    const mediaType = detectMediaType(file)
    if (!mediaType) {
      toast.error("Unsupported file type.")
      return
    }

    const maxSizeMB = mediaType === "IMAGE" ? 10 : mediaType === "VIDEO" ? 50 : 20
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB.`)
      return
    }

    setMediaFile(file)
    if (mediaType === "IMAGE") {
      setMediaPreview(URL.createObjectURL(file))
    }

    setMediaUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10))
    }, 150)

    try {
      const safeName = file.name.replace(/\s+/g, "_")
      const path = `${projectId}/posts/${crypto.randomUUID()}/${safeName}`

      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", path)

      const res = await fetch(`/api/projects/${projectId}/posts/media`, {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      clearInterval(progressInterval)

      if (!res.ok) throw new Error(data.error || "Upload failed.")

      setUploadProgress(100)
      setMediaPath(data.path)
      toast.success("Media uploaded.")
    } catch (err: any) {
      clearInterval(progressInterval)
      setMediaFile(null)
      setMediaPreview(null)
      toast.error(err.message)
    } finally {
      setMediaUploading(false)
    }
  }, [projectId])

  const handleRemoveMedia = async () => {
    if (mediaPath && !mediaPath.includes(post.media_url)) {
      try {
        await fetch(`/api/projects/${projectId}/posts/media`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: mediaPath })
        })
      } catch {}
    }
    setMediaFile(null)
    setMediaPreview(null)
    setMediaPath(null)
    setUploadProgress(0)
  }

  const openEdit = () => {
    setEditTitle(post.title || "")
    setEditDesc(post.description || "")
    setEditTags(post.tags || [])
    setMediaPath(post.media_url || null)
    setMediaPreview(null)
    setMediaFile(null)
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
      const mediaType = mediaFile ? detectMediaType(mediaFile) : post.media_type

      const res = await fetch(`/api/projects/${projectId}/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          description: editDesc.trim(),
          tags: editTags.length > 0 ? editTags : null,
          milestone_id: post.milestone_id || null,
          media_url: mediaPath,
          media_type: mediaType,
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
    <div className={`relative bg-surface rounded-xl border overflow-hidden ${isHidden ? "opacity-75" : ""}`}>
      {/* Hidden overlay badge */}
      {isHidden && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-3 left-3">
            <span className="bg-error-container/50 text-destructive text-xs font-semibold px-2 py-0.5 rounded-full border border-error-container">
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
              className="w-7 h-7 rounded-full bg-surface border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
              title="Edit post"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleHideToggle}
              disabled={isToggling}
              className={`w-7 h-7 rounded-full bg-surface border flex items-center justify-center transition-colors ${
                isHidden
                  ? "border-primary text-primary hover:bg-primary-container/20"
                  : "border-outline-variant/50 text-on-surface-variant hover:text-destructive hover:border-red-300"
              }`}
              title={isHidden ? "Unhide post" : "Hide post"}
            >
              {isHidden ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-7 h-7 rounded-full bg-surface border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:text-destructive hover:border-red-300 transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Media */}
      {mediaUrl && !isEditing && (
        <div className="w-full">
          {post.media_type === "IMAGE" && (
            <img
              src={mediaUrl}
              alt={post.title || "Post media"}
              className="w-full max-h-72 object-cover rounded-t-xl"
            />
          )}
          {post.media_type === "VIDEO" && (
            <video controls className="w-full rounded-t-xl bg-black max-h-72">
              <source src={mediaUrl} />
            </video>
          )}
          {post.media_type === "AUDIO" && (
            <div className="px-5 pt-4">
              <audio controls className="w-full text-xs">
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
              <Label className="text-xs text-on-surface-variant">Title (optional)</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Post title"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-on-surface-variant">
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
              <Label className="text-xs text-on-surface-variant">Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleEditTag(tag)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      editTags.includes(tag)
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-on-surface-variant border-outline-variant/50 hover:border-primary"
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

            {/* Media editing */}
            <div className="space-y-1.5">
              <Label className="text-xs text-on-surface-variant">Media</Label>
              {!mediaPath ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-surface-variant/20 transition-colors"
                >
                  <Upload className="w-5 h-5 text-outline mx-auto mb-1" />
                  <p className="text-xs text-on-surface-variant">Click to upload new media</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant truncate max-w-[200px]">
                      {mediaFile ? mediaFile.name : "Current media"}
                    </span>
                    <button onClick={handleRemoveMedia} className="text-xs text-red-500 hover:text-destructive">
                      Remove
                    </button>
                  </div>
                  {mediaUploading && (
                    <div className="w-full bg-surface-variant/50 rounded-full h-1 overflow-hidden">
                      <div className="bg-primary-container/200 h-1 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="text-on-surface-variant"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="bg-primary hover:bg-primary text-white"
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
                    className="px-2 py-0.5 bg-primary-container/20 text-primary text-xs rounded-full border border-primary-container/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Milestone */}
            {post.milestone?.name && (
              <div className="mb-2">
                <span className="text-xs text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full border border-outline-variant/50">
                  {post.milestone.name}
                </span>
              </div>
            )}

            {/* Title */}
            {post.title && (
              <h3 className="text-base font-bold text-on-surface leading-snug">
                {post.title}
              </h3>
            )}

            {/* Description */}
            <p className="text-sm text-on-surface mt-1 line-clamp-3 leading-relaxed">
              {post.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-container/50 flex items-center justify-center text-primary text-xs font-semibold">
                  {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div>
                  <span className="text-xs font-medium text-on-surface">
                    {post.author?.name || "Admin"}
                  </span>
                  <span className="text-xs text-outline ml-2">
                    {formatDateTime(post.created_at)}
                  </span>
                </div>
              </div>

              {/* View count */}
              <span className="text-xs text-outline">
                👁 {viewCount}
              </span>
            </div>

            {/* Reactions */}
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-on-surface-variant">👍 {rc.LIKE}</span>
              <span className="text-xs text-on-surface-variant">❤️ {rc.LOVE}</span>
              <span className="text-xs text-on-surface-variant">👏 {rc.APPRECIATE}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
