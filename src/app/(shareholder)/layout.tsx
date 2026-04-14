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
    <div className="flex h-screen bg-background overflow-hidden">
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
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:static lg:translate-x-0 lg:w-[260px] lg:border-r lg:border-outline-variant/50",
          isMobileMenuOpen ? "translate-x-0 shadow-m3-5" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-outline-variant/50">
          <Link href="/my/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary tracking-tight">NirmaN</span>
          </Link>
          <button className="lg:hidden p-2 rounded-full hover:bg-surface-variant/50" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Info Area */}
        <div className="px-5 py-4 border-b border-outline-variant/50">
          <h2 className="font-semibold text-on-surface truncate">Shareholder Portal</h2>
          <span className="mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-container text-on-primary-container">
            Active
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname?.includes(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-on-primary-container" : "text-on-surface-variant group-hover:text-on-surface"
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}

          {/* Governance / Committee Section */}
          {isCommitteeMember && (
            <div className="mt-6 pt-4 border-t border-outline-variant/30">
              <p className="px-4 text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Governance</p>
              <Link
                href="/my/review"
                className={cn(
                  "group flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/my/review"
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShieldCheck
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    pathname === "/my/review" ? "text-on-primary-container" : "text-on-surface-variant group-hover:text-on-surface"
                  )}
                  aria-hidden="true"
                />
                Committee Review
              </Link>
              <Link
                href="/my/defaulters"
                className={cn(
                  "group flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 mt-1",
                  pathname === "/my/defaulters"
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AlertTriangle
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    pathname === "/my/defaulters" ? "text-on-primary-container" : "text-on-surface-variant group-hover:text-on-surface"
                  )}
                  aria-hidden="true"
                />
                Defaulter List
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="border-t border-outline-variant/50 p-4">
          <div className="flex items-center justify-between">
            <Link href="/my/profile" className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-surface-variant/50 transition-all duration-200 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                  {profile?.name || profile?.email || "Shareholder"}
                </span>
                <span className="mt-0.5 inline-flex items-center w-fit rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-medium text-on-secondary-container">
                  Shareholder
                </span>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full p-2 text-on-surface-variant hover:bg-error-container/50 hover:text-on-error-container transition-all duration-200"
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
        <header className="flex h-16 items-center justify-between border-b border-outline-variant/50 bg-surface px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-on-surface">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
