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
import { ThemeToggle } from "@/components/ThemeToggle"
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
  const [projectName, setProjectName] = useState<string>("")
  const [unitFlat, setUnitFlat] = useState<string>("")
  const [shareholderStatus, setShareholderStatus] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("name, avatar_url, email").eq("id", user.id).single()
        setProfile(profileData)

        const { data: shareholderData } = await supabase.from("shareholders").select("unit_flat, status, projects(name)").eq("user_id", user.id).single()
        if (shareholderData?.unit_flat) {
          setUnitFlat(shareholderData.unit_flat)
        }
        if (shareholderData?.status) {
          setShareholderStatus(shareholderData.status)
        }
        const projects = shareholderData?.projects as any
        if (Array.isArray(projects) && projects[0]?.name) {
          setProjectName(projects[0].name)
        } else if (projects?.name) {
          setProjectName(projects.name)
        }

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
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
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
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[var(--surface-container-low)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:static lg:translate-x-0 lg:w-[260px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Link href="/my/dashboard" className="flex items-center gap-2 mt-4 mb-4 pl-1 text-white">
            <img src="/nirman-logo.svg" alt="NirmaN" className="h-7" />
          </Link>
          <button className="lg:hidden p-2 rounded-full hover:bg-[var(--surface-container-high)]" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-[var(--on-surface-variant)]" />
          </button>
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
                    ? "bg-[var(--primary-container)] text-[var(--primary)] font-semibold"
                    : "text-[var(--on-surface)] hover:bg-[var(--surface-container)] font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-[var(--primary)]" : "text-[var(--on-surface)]"
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}

          {/* Governance / Committee Section */}
          {isCommitteeMember && (
            <div className="mt-6 pt-4 border-t border-[var(--outline-variant)]/30">
              <p className="px-4 text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mb-2">Governance</p>
              <Link
                href="/my/review"
                className={cn(
                  "group flex h-12 items-center rounded-full px-4 text-sm font-medium transition-all duration-200",
                  pathname === "/my/review"
                    ? "bg-[var(--primary-container)] text-[var(--primary)] font-semibold"
                    : "text-[var(--on-surface)] hover:bg-[var(--surface-container)] font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShieldCheck
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    pathname === "/my/review" ? "text-[var(--primary)]" : "text-[var(--on-surface)]"
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
                    ? "bg-[var(--primary-container)] text-[var(--primary)] font-semibold"
                    : "text-[var(--on-surface)] hover:bg-[var(--surface-container)] font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AlertTriangle
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    pathname === "/my/defaulters" ? "text-[var(--primary)]" : "text-[var(--on-surface)]"
                  )}
                  aria-hidden="true"
                />
                Defaulter List
              </Link>
            </div>
          )}
        </nav>

        {/* Portal Type Card */}
        <div className="mx-3 my-3 px-4 space-y-2">
          {shareholderStatus && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${shareholderStatus === "ACTIVE" ? "bg-primary-container/50 text-on-primary-container" : "bg-surface-variant/50 text-on-surface-variant"}`}>
              {shareholderStatus === "ACTIVE" ? "Active" : "Inactive"}
            </span>
          )}
          <div>
            <p className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">Shareholders</p>
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {projectName || "—"}
            </p>
            <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">
              Unit {unitFlat || "—"}
            </p>
          </div>
        </div>

        {/* Sidebar Footer (User Info) */}
        <div className="p-4 border-t border-[var(--outline-variant)]/30 mx-2 mb-2 rounded-2xl bg-white/40">
          <div className="flex items-center justify-between">
            <Link href="/my/profile" className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-white/60 transition-all duration-200 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[var(--secondary-container)] flex items-center justify-center text-[var(--on-secondary-container)] text-sm font-bold shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {profile?.name || profile?.email}
                </span>
                <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Shareholder
                </span>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full p-2 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--destructive)] transition-all duration-200"
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
        <header className="flex h-16 items-center justify-between bg-[var(--background)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-full text-white lg:hidden hover:bg-[var(--surface-container-high)]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-[22px] font-normal text-[var(--foreground)]">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
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
