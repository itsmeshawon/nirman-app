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
          <Link href={`/${projectId}/dashboard`} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary tracking-tight">NirmaN</span>
          </Link>
          <button className="lg:hidden p-2 rounded-full hover:bg-surface-variant/50" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Project Info Area */}
        <div className="px-5 py-4 border-b border-outline-variant/50">
          <h2 className="font-semibold text-on-surface truncate" title={projectName}>
            {projectName}
          </h2>
          <span
            className={cn(
              "mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusColor(projectStatus)
            )}
          >
            {projectStatus.replace("_", " ")}
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
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="border-t border-outline-variant/50 p-4">
          <div className="flex items-center justify-between">
            <Link href={`/${projectId}/profile`} className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-surface-variant/50 transition-all duration-200 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  profileName?.charAt(0)?.toUpperCase() || "A"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                  {profileName || user?.email}
                </span>
                <span className="mt-0.5 inline-flex items-center w-fit rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-medium text-on-secondary-container">
                  Project Admin
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
        <header className="flex h-16 items-center justify-between border-b border-outline-variant/50 bg-surface px-4 sm:px-6 lg:px-8">
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

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Only Project Name Snippet */}
            <div className="hidden lg:flex lg:items-center lg:gap-2 mr-2">
                <span className="text-sm text-on-surface-variant">Project:</span>
                <span className="text-sm font-medium text-on-surface">{projectName}</span>
            </div>
            <NotificationBell projectId={projectId} />
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
