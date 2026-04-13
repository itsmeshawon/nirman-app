"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single()
        setProfile(data)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-xl font-black text-[#4F46E5] tracking-tight">NirmaN</Link>
        <Link href="/profile" className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none group-hover:text-[#4F46E5] transition-colors">{profile?.name || "Member"}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Committee</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold border border-indigo-100 overflow-hidden group-hover:border-indigo-300 transition-colors">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile?.name?.charAt(0)?.toUpperCase() || "C"
            )}
          </div>
        </Link>
      </header>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
