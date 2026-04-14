"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Flag,
  Receipt,
  Banknote,
  MessageSquare,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { cn } from "@/lib/utils"

interface ProjectAdminShellProps {
  children: React.ReactNode
  projectId: string
  projectName: string
  projectStatus: string
  user: User | null
  profileName: string
  avatarUrl?: string | null
}

export default function ProjectAdminShell({
  children,
  projectId,
  projectName,
  projectStatus,
  user,
  profileName,
  avatarUrl,
}: ProjectAdminShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    { label: "Dashboard", href: `/${projectId}/dashboard`, icon: LayoutDashboard },
    { label: "Shareholders", href: `/${projectId}/shareholders`, icon: Users },
    { label: "Committee", href: `/${projectId}/committee`, icon: ShieldCheck },
    { label: "Milestones", href: `/${projectId}/milestones`, icon: Flag },
    { label: "Expenses", href: `/${projectId}/expenses`, icon: Receipt },
    { label: "Payments", href: `/${projectId}/payments`, icon: Banknote },
    { label: "Defaulters", href: `/${projectId}/defaulters`, icon: AlertTriangle },
    { label: "Activity Feed", href: `/${projectId}/feed`, icon: MessageSquare },
    { label: "Documents", href: `/${projectId}/documents`, icon: FolderOpen },
    { label: "Reports", href: `/${projectId}/reports`, icon: BarChart3 },
    { label: "Settings", href: `/${projectId}/settings`, icon: Settings },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Determine current page title
  const activeNavItem = navItems.find((item) => pathname?.includes(item.href))
  let pageTitle = activeNavItem ? activeNavItem.label : "Dashboard"

  if (pathname.endsWith("/profile")) pageTitle = "My Profile"

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-primary-container text-on-primary-container"
      case "IN_PROGRESS":
      case "PILOT":
        return "bg-tertiary-container text-on-tertiary-container"
      default:
        return "bg-surface-variant text-on-surface-variant"
    }
  }

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
          <Link href={`/${projectId}/dashboard`} className="flex items-center gap-2">
            <span className="text-[24px] font-normal text-[#0F766E] tracking-tight">NirmaN</span>
          </Link>
          <button className="lg:hidden p-2 rounded-full hover:bg-[#ECE6F0]" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-[#49454F]" />
          </button>
        </div>

        {/* Project Info Area */}
        <div className="px-6 py-4">
          <h2 className="text-[14px] font-medium text-[#1D1B20] truncate" title={projectName}>
            {projectName}
          </h2>
          <span className="mt-1 inline-flex items-center rounded-full bg-[#E8DEF8] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1D192B]">
            {projectStatus.replace("_", " ")}
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
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="p-4 border-t border-[#CAC4D0]/30 mx-2 mb-2 rounded-2xl bg-white/40">
          <div className="flex items-center justify-between">
            <Link href={`/${projectId}/profile`} className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-white/60 transition-all duration-200 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#E8DEF8] flex items-center justify-center text-[#1D192B] text-sm font-bold shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  profileName?.charAt(0)?.toUpperCase() || "A"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-semibold text-[#1D1B20] truncate">
                  {profileName || user?.email}
                </span>
                <span className="text-[10px] font-bold text-[#49454F] uppercase tracking-wider">
                  Admin
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
        <header className="flex h-16 items-center justify-between bg-[#fefaff]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-full text-[#49454F] lg:hidden hover:bg-[#ECE6F0]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-[22px] font-normal text-[#1D1B20]">{pageTitle}</h1>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Only Project Name Snippet */}
            <div className="hidden lg:flex lg:items-center lg:gap-2 mr-2">
                <span className="text-[12px] font-bold text-[#49454F] uppercase tracking-wider">Project</span>
                <span className="text-[14px] font-medium text-[#1D1B20]">{projectName}</span>
            </div>
            <NotificationBell projectId={projectId} />
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
