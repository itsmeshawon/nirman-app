"use client"

import { useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload, X, Music, Video, Image as ImageIcon, Tag } from "lucide-react"

interface CreatePostFormProps {
  projectId: string
  milestones: any[]
  userId: string
  onSuccess: (post: any) => void
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

export function CreatePostForm({ projectId, milestones, userId, onSuccess }: CreatePostFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState("")
  const [milestoneId, setMilestoneId] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [mediaPath, setMediaPath] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setTags([])
    setCustomTagInput("")
    setMilestoneId("")
    setMediaFile(null)
    setMediaPreview(null)
    setMediaPath(null)
    setUploadProgress(0)
    setIsExpanded(false)
  }

  const handleFileSelect = useCallback(async (file: File) => {
    const mediaType = detectMediaType(file)
    if (!mediaType) {
      toast.error("Unsupported file type. Please upload an image, video, or audio file.")
      return
    }

    // Size validation
    const maxSizeMB = mediaType === "IMAGE" ? 10 : mediaType === "VIDEO" ? 50 : 20
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size for ${mediaType.toLowerCase()} is ${maxSizeMB}MB.`)
      return
    }

    setMediaFile(file)
    if (mediaType === "IMAGE") {
      setMediaPreview(URL.createObjectURL(file))
    }

    // Upload to Supabase Storage
    setMediaUploading(true)
    setUploadProgress(0)

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
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

      if (!res.ok) throw new Error(data.error || "Failed to upload media.")

      setUploadProgress(100)
      setMediaPath(data.path)
      toast.success("Media uploaded successfully.")
    } catch (err: any) {
      clearInterval(progressInterval)
      setMediaFile(null)
      setMediaPreview(null)
      setUploadProgress(0)
      toast.error(err.message || "Failed to upload media.")
    } finally {
      setMediaUploading(false)
    }
  }, [projectId])

  const handleRemoveMedia = async () => {
    if (mediaPath) {
      try {
        await fetch(`/api/projects/${projectId}/posts/media`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: mediaPath })
        })
      } catch {
        // Non-critical — don't block UI
      }
    }
    setMediaFile(null)
    setMediaPreview(null)
    setMediaPath(null)
    setUploadProgress(0)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setCustomTagInput("")
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handlePublish = async () => {
    if (!description.trim() || description.trim().length < 5) {
      toast.error("Description must be at least 5 characters.")
      return
    }

    if (mediaUploading) {
      toast.error("Please wait for media to finish uploading.")
      return
    }

    setIsSubmitting(true)
    try {
      const mediaType = mediaFile ? detectMediaType(mediaFile) : null

      const res = await fetch(`/api/projects/${projectId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          description: description.trim(),
          media_url: mediaPath || null,
          media_type: mediaType || null,
          tags: tags.length > 0 ? tags : null,
          milestone_id: milestoneId || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to publish post.")

      toast.success("Post published successfully!")
      onSuccess(data.post)
      resetForm()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isExpanded) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-text"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
            PA
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-400 border border-gray-100 hover:border-teal-200 transition-colors">
            Share a project update...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="post-title" className="text-xs text-gray-500 font-medium">
          Title (optional)
        </Label>
        <Input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Foundation work completed"
          className="h-8 text-sm"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="post-desc" className="text-xs text-gray-500 font-medium">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="post-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's happening on site today?"
          rows={4}
          className="resize-none text-sm"
        />
        <p className="text-xs text-gray-400">{description.length} characters (min. 5)</p>
      </div>

      {/* Media Upload */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 font-medium">Media (optional)</Label>

        {!mediaFile ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-teal-400 bg-teal-50"
                : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">Images ≤10MB · Videos ≤50MB · Audio ≤20MB</p>
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
          <div className="border rounded-lg p-3 space-y-2">
            {/* Preview */}
            {mediaPreview && mediaFile.type.startsWith("image/") ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-md"
              />
            ) : mediaFile.type.startsWith("video/") ? (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Video className="w-4 h-4 text-blue-500" />
                <span className="font-medium truncate">{mediaFile.name}</span>
                <span className="text-gray-400 text-xs shrink-0">{formatBytes(mediaFile.size)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Music className="w-4 h-4 text-purple-500" />
                <span className="font-medium truncate">{mediaFile.name}</span>
                <span className="text-gray-400 text-xs shrink-0">{formatBytes(mediaFile.size)}</span>
              </div>
            )}

            {/* Upload Progress */}
            {mediaUploading && (
              <div className="space-y-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">Uploading... {uploadProgress}%</p>
              </div>
            )}

            {!mediaUploading && mediaPath && (
              <p className="text-xs text-teal-600 font-medium">Upload complete</p>
            )}

            <button
              type="button"
              onClick={handleRemoveMedia}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 font-medium">Tags</Label>

        {/* Predefined tag pills */}
        <div className="flex flex-wrap gap-1.5">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                tags.includes(tag)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Custom tag input */}
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
            placeholder="Add custom tag and press Enter"
            className="h-7 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomTag}
            className="h-7 text-xs px-2"
          >
            <Tag className="w-3 h-3" />
          </Button>
        </div>

        {/* Active custom tags */}
        {tags.filter((t) => !PREDEFINED_TAGS.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags
              .filter((t) => !PREDEFINED_TAGS.includes(t))
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Milestone */}
      {milestones.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="post-milestone" className="text-xs text-gray-500 font-medium">
            Milestone (optional)
          </Label>
          <select
            id="post-milestone"
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            className="w-full h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">No milestone</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={resetForm}
          disabled={isSubmitting}
          className="text-gray-500"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handlePublish}
          disabled={isSubmitting || mediaUploading}
          className="bg-teal-700 hover:bg-teal-800 text-white"
        >
          {isSubmitting ? "Publishing..." : "Publish Post"}
        </Button>
      </div>
    </div>
  )
}
