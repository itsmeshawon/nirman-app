"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowLeft, User, Mail, Phone, Building2, Briefcase, MapPin, MessageCircle, Camera } from "lucide-react"
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

export default function MyProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [initialData, setInitialData] = useState<any>(null)

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
      // Reset isDirty state by re-setting the form with the new data
      reset(data)
      
      // Refresh the Next.js router so parent layouts reflect the new name instantly
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 sticky top-0 z-20">
          <Skeleton className="h-8 w-24" />
        </header>
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 mt-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 sticky top-0 z-20">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Account Settings</h1>
          <p className="text-gray-500 mt-2">Manage your construction profile and contact details.</p>
        </div>

        <div className="bg-white rounded-[1.25rem] shadow-eos-xl border border-indigo-50/50 overflow-hidden">
          {/* Cover/Header area */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
            <div className="absolute -bottom-12 left-8 md:left-12">
              <div className="relative group">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-bold shadow-sm overflow-hidden">
                  {initialData?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <button className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md text-gray-600 hover:text-indigo-600 transition-colors border border-gray-100">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-6 px-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{initialData?.name}</h2>
              <p className="text-sm text-gray-500">{initialData?.role?.replace('_', ' ')}</p>
            </div>
            {isDirty && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Unsaved Changes</span>
              </div>
            )}
          </div>
          
          <div className="px-8 md:px-12 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input id="name" {...register("name")} className="pl-9" placeholder="John Doe" />
                </div>
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input 
                    id="email" 
                    value={initialData?.email || ""} 
                    disabled 
                    className="pl-9 bg-gray-50 text-gray-500 cursor-not-allowed font-medium" 
                  />
                </div>
                <p className="text-[10px] text-gray-400">Email cannot be changed.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Mobile No.</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input id="phone" {...register("phone")} className="pl-9" placeholder="+880..." />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_no" className="text-gray-700">WhatsApp No.</Label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input id="whatsapp_no" {...register("whatsapp_no")} className="pl-9" placeholder="+880..." />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                Professional Details
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-gray-700">Profession</Label>
                  <Input id="profession" {...register("profession")} placeholder="e.g. Engineer" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-gray-700">Designation</Label>
                  <Input id="designation" {...register("designation")} placeholder="e.g. Senior Architect" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="organization" className="text-gray-700">Organization</Label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input id="organization" {...register("organization")} className="pl-9" placeholder="Company Name" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Address
              </h3>
              <div className="space-y-2">
                <Label htmlFor="present_address" className="text-gray-700">Present Address</Label>
                <Textarea 
                  id="present_address" 
                  {...register("present_address")} 
                  placeholder="Enter your full present address..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="pt-8 flex justify-end items-center gap-4">
              <Button 
                type="submit" 
                disabled={isSaving || !isDirty}
                className="bg-[#4F46E5] hover:bg-indigo-700 min-w-[160px] h-11 rounded-xl shadow-eos font-semibold transition-all active:scale-[0.98]"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
          </div>
        </div>
      </main>
    </div>
  )
}
