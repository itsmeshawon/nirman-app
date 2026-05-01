"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, Building2, Briefcase, MapPin, MessageCircle, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EditProfileModal } from "@/components/profile/EditProfileModal"

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">
        <Icon className="w-4 h-4 text-outline" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">{label}</p>
        <p className="text-sm text-on-surface mt-0.5 break-words">{value || <span className="text-on-surface-variant/60 italic">Not set</span>}</p>
      </div>
    </div>
  )
}

export function ProfileForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)

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
        setProfile(data)
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  const handleEditSuccess = (updatedData: any) => {
    setProfile((prev: any) => ({ ...prev, ...updatedData }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-[400px] w-full rounded-[1.25rem]" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <>
      <div className="bg-surface rounded-[1.25rem] border border-outline-variant/40 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-secondary relative">
          <div className="absolute -bottom-12 left-8 md:left-12">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-primary-container/20 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-4 px-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">{profile.name}</h2>
            <p className="text-sm text-on-surface-variant">{profile.role?.replace(/_/g, " ")}</p>
          </div>
          <Button
            onClick={() => setEditOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white h-10 font-semibold gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>

        <div className="px-8 md:px-12 pb-8">
          <div className="border-t border-outline-variant/40 pt-6">
            <h3 className="text-sm font-semibold text-on-surface mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-outline" />
              Personal Information
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <InfoRow icon={User} label="Full Name" value={profile.name} />
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow icon={Phone} label="Mobile No." value={profile.phone} />
              <InfoRow icon={MessageCircle} label="WhatsApp No." value={profile.whatsapp_no} />
            </div>
          </div>

          <div className="border-t border-outline-variant/40 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-on-surface mb-5 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-outline" />
              Professional Details
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <InfoRow icon={Briefcase} label="Profession" value={profile.profession} />
              <InfoRow icon={User} label="Designation" value={profile.designation} />
              <InfoRow icon={Building2} label="Organization" value={profile.organization} />
            </div>
          </div>

          <div className="border-t border-outline-variant/40 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-on-surface mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-outline" />
              Address
            </h3>
            <InfoRow icon={MapPin} label="Present Address" value={profile.present_address} />
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        onSuccess={handleEditSuccess}
      />
    </>
  )
}
