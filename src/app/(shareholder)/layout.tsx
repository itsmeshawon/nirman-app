"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Bell,
  Menu,
  X,
  Receipt,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Users,
  Flag
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/my/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my/milestones", label: "Milestones", icon: Flag },
  { href: "/my/shareholders", label: "Shareholders", icon: Users },
  { href: "/my/payments", label: "My Payments", icon: CreditCard },
  { href: "/my/expenses", label: "Expenses", icon: Receipt },
  { href: "/my/documents", label: "Documents", icon: FileText },
  { href: "/my/feed", label: "Activity Feed", icon: Bell },
]

export default function ShareholderLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [isCommitteeMember, setIsCommitteeMember] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("name, avatar_url, email").eq("id", user.id).single()
        setProfile(profileData)

        const { data: committeeData } = await supabase
          .from("committee_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)

        if (committeeData && committeeData.length > 0) {
          setIsCommitteeMember(true)
        }
      }
    }
    fetchData()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const activeNavItem = navItems.find((item) => pathname?.includes(item.href))
  let pageTitle = activeNavItem ? activeNavItem.label : "Dashboard"

  if (pathname === "/my/profile") pageTitle = "My Profile"
  if (pathname === "/my/review") pageTitle = "Committee Review"
  if (pathname === "/my/defaulters") pageTitle = "Defaulter List"
  if (pathname === "/my/shareholders") pageTitle = "Shareholder List"
  if (pathname === "/my/milestones") pageTitle = "Project Milestones"

  return (
    <div className="flex h-screen bg-[#fefaff] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/32 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#F7F2FA] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:static lg:translate-x-0 lg:w-[260px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Link href="/my/dashboard" className="flex items-center gap-2">
            <span className="text-[24px] font-normal text-[#0F766E] tracking-tight">NirmaN</span>
          </Link>
          <button className="lg:hidden p-2 rounded-full hover:bg-[#ECE6F0]" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-[#49454F]" />
          </button>
        </div>

        {/* Info Area */}
        <div className="px-6 py-4">
          <h2 className="text-[14px] font-medium text-[#1D1B20] truncate">Shareholder Portal</h2>
          <span className="mt-1 inline-flex items-center rounded-full bg-[#CCE8E4] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
            Active
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname?.includes(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex h-12 items-center rounded-full px-4 text-sm transition-all duration-200",
                  isActive
                    ? "bg-[#CCE8E4] text-[#0F766E] font-semibold"
                    : "text-[#49454F] hover:bg-[#F3EDF7] font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-[#0F766E]" : "text-[#49454F]"
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}

          {/* Governance / Committee Section */}
          {isCommitteeMember && (
            <div className="mt-6 pt-4 border-t border-[#CAC4D0]/30">
              <p className="px-4 text-[10px] font-bold text-[#49454F] uppercase tracking-widest mb-2">Governance</p>
              <Link
                href="/my/review"
                className={cn(
                  "group flex h-12 items-center rounded-full px-4 text-sm font-medium transition-all duration-200",
                  pathname === "/my/review"
                    ? "bg-[#CCE8E4] text-[#0F766E] font-semibold"
                    : "text-[#49454F] hover:bg-[#F3EDF7] font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShieldCheck
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    pathname === "/my/review" ? "text-[#0F766E]" : "text-[#49454F]"
                  )}
                  aria-hidden="true"
                />
                Committee Review
              </Link>
              <Link
                href="/my/defaulters"
                className={cn(
                  "group flex h-12 items-center rounded-full px-4 text-sm font-medium transition-all duration-200 mt-1",
                  pathname === "/my/defaulters"
                    ? "bg-[#CCE8E4] text-[#0F766E] font-semibold"
                    : "text-[#49454F] hover:bg-[#F3EDF7] font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AlertTriangle
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    pathname === "/my/defaulters" ? "text-[#0F766E]" : "text-[#49454F]"
                  )}
                  aria-hidden="true"
                />
                Defaulter List
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="p-4 border-t border-[#CAC4D0]/30 mx-2 mb-2 rounded-2xl bg-white/40">
          <div className="flex items-center justify-between">
            <Link href="/my/profile" className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-white/60 transition-all duration-200 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#E8DEF8] flex items-center justify-center text-[#1D192B] text-sm font-bold shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-semibold text-[#1D1B20] truncate">
                  {profile?.name || profile?.email}
                </span>
                <span className="text-[10px] font-bold text-[#49454F] uppercase tracking-wider">
                  Shareholder
                </span>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full p-2 text-[#49454F] hover:bg-[#ECE6F0] hover:text-[#B3261E] transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between bg-[#fefaff]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-full text-[#49454F] lg:hidden hover:bg-[#ECE6F0]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-[22px] font-normal text-[#1D1B20]">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl w-full py-8 px-4 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
