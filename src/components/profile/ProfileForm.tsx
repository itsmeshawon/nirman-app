"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User, Mail, Phone, Building2, Briefcase, MapPin, MessageCircle, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

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

export function ProfileForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [initialData, setInitialData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
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
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile")
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch profile")
        }
        const data = await res.json()
        setInitialData(data)
        reset({
          name: data.name || "",
          phone: data.phone || "",
          whatsapp_no: data.whatsapp_no || "",
          profession: data.profession || "",
          designation: data.designation || "",
          organization: data.organization || "",
          present_address: data.present_address || "",
        })
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [router, reset])

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
      setInitialData({ ...initialData, avatar_url: data.avatarUrl })
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Update failed")

      toast.success("Profile updated successfully")
      reset(data)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-[400px] w-full rounded-[1.25rem]" />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-[1.25rem] border border-primary-container/30/50 overflow-hidden">
      {/* Cover/Header area */}
      <div className="h-32 bg-gradient-to-r from-primary to-secondary relative">
        <div className="absolute -bottom-12 left-8 md:left-12">
          <div className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-primary-container/20 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden relative">
              {initialData?.avatar_url ? (
                <img 
                  src={initialData.avatar_url} 
                  alt={initialData.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                initialData?.name?.charAt(0)?.toUpperCase() || "U"
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-primary/90/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-1 right-1 bg-surface p-1.5 rounded-full text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/40 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
      </div>

      <div className="pt-16 pb-6 px-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">{initialData?.name}</h2>
          <p className="text-sm text-on-surface-variant">{initialData?.role?.replace('_', ' ')}</p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container/20 rounded-full border border-amber-100">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-on-tertiary-container uppercase tracking-wider">Unsaved Changes</span>
          </div>
        )}
      </div>
      
      <div className="px-8 md:px-12 pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-on-surface">Full Name <span className="text-red-500">*</span></Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input id="name" {...register("name")} className="pl-9 h-11 rounded-xl" placeholder="John Doe" />
            </div>
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-on-surface">Email Address</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input 
                id="email" 
                value={initialData?.email || ""} 
                disabled 
                className="pl-9 bg-surface-variant/20 text-on-surface-variant cursor-not-allowed font-medium h-11 rounded-xl" 
              />
            </div>
            <p className="text-[10px] text-outline">Email cannot be changed.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-on-surface">Mobile No.</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input id="phone" {...register("phone")} className="pl-9 h-11 rounded-xl" placeholder="+880..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_no" className="text-on-surface">WhatsApp No.</Label>
            <div className="relative">
              <MessageCircle className="w-4 h-4 absolute left-3 top-3 text-outline" />
              <Input id="whatsapp_no" {...register("whatsapp_no")} className="pl-9 h-11 rounded-xl" placeholder="+880..." />
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant/40 pt-6 mt-2">
          <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-outline" />
            Professional Details
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profession" className="text-on-surface">Profession</Label>
              <Input id="profession" {...register("profession")} className="h-11 rounded-xl" placeholder="e.g. Engineer" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation" className="text-on-surface">Designation</Label>
              <Input id="designation" {...register("designation")} className="h-11 rounded-xl" placeholder="e.g. Senior Architect" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="organization" className="text-on-surface">Organization</Label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-3 text-outline" />
                <Input id="organization" {...register("organization")} className="pl-9 h-11 rounded-xl" placeholder="Company Name" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant/40 pt-6 mt-2">
          <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-outline" />
            Address
          </h3>
          <div className="space-y-2">
            <Label htmlFor="present_address" className="text-on-surface">Present Address</Label>
            <Textarea 
              id="present_address" 
              {...register("present_address")} 
              placeholder="Enter your full present address..."
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>
        </div>

        <div className="pt-8 flex justify-end items-center gap-4">
          <Button 
            type="submit" 
            disabled={isSaving || !isDirty}
            variant="default"
            className="min-w-[160px] h-11 font-semibold"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
