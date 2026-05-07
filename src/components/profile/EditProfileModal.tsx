"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User, Mail, Phone, Building2, Briefcase, MapPin, MessageCircle, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  whatsapp_no: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  present_address: z.string().optional().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: any
  onSuccess: (updatedData: ProfileFormValues) => void
}

export function EditProfileModal({ open, onOpenChange, profile, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      whatsapp_no: "",
      profession: "",
      designation: "",
      organization: "",
      present_address: "",
    },
  })

  useEffect(() => {
    if (open && profile) {
      reset({
        name: profile.name || "",
        phone: profile.phone || "",
        whatsapp_no: profile.whatsapp_no || "",
        profession: profile.profession || "",
        designation: profile.designation || "",
        organization: profile.organization || "",
        present_address: profile.present_address || "",
      })
    }
  }, [open, profile, reset])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      toast.success("Avatar updated successfully")
      onSuccess({ ...profile, avatar_url: data.avatarUrl } as any)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Update failed")

      toast.success("Profile updated successfully")
      onOpenChange(false)
      onSuccess(values)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full border-2 border-primary-container bg-primary-container/20 flex items-center justify-center text-primary text-xl font-bold overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "U"
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 bg-surface p-1 rounded-full text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/40 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">{profile?.name}</p>
              <p className="text-xs text-on-surface-variant">{profile?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-on-surface">Full Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                <Input id="edit-name" {...register("name")} className="pl-9 h-11 rounded-xl" placeholder="John Doe" />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-on-surface">Email Address</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                <Input
                  id="edit-email"
                  value={profile?.email || ""}
                  disabled
                  className="pl-9 bg-surface-variant/20 text-on-surface-variant cursor-not-allowed font-medium h-11 rounded-xl"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant">Email cannot be changed.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-on-surface">Mobile No.</Label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                <Input id="edit-phone" {...register("phone")} className="pl-9 h-11 rounded-xl" placeholder="+880..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-whatsapp" className="text-on-surface">WhatsApp No.</Label>
              <div className="relative">
                <MessageCircle className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                <Input id="edit-whatsapp" {...register("whatsapp_no")} className="pl-9 h-11 rounded-xl" placeholder="+880..." />
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/40 pt-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-on-surface-variant" />
              Professional Details
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-profession" className="text-on-surface">Profession</Label>
                <Input id="edit-profession" {...register("profession")} className="h-11 rounded-xl" placeholder="e.g. Engineer" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-designation" className="text-on-surface">Designation</Label>
                <Input id="edit-designation" {...register("designation")} className="h-11 rounded-xl" placeholder="e.g. Senior Architect" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-organization" className="text-on-surface">Organization</Label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
                  <Input id="edit-organization" {...register("organization")} className="pl-9 h-11 rounded-xl" placeholder="Company Name" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/40 pt-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-on-surface-variant" />
              Address
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-on-surface">Present Address</Label>
              <Textarea
                id="edit-address"
                {...register("present_address")}
                placeholder="Enter your full present address..."
                rows={3}
                className="resize-none rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
