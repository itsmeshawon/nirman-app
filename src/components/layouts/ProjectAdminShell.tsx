"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Flag,
  Receipt,
  Banknote,
  Newspaper,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ClipboardList
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"
import { usePageTitle } from "@/context/PageTitleContext"

interface ProjectAdminShellProps {
  children: React.ReactNode
  projectId: string
  projectName: string
  projectStatus: string
  profileName: string
  avatarUrl?: string | null
  isArchived?: boolean
  isLoading?: boolean
}

export default function ProjectAdminShell({
  children,
  projectId,
  projectName,
  projectStatus,
  profileName,
  avatarUrl,
  isArchived = false,
  isLoading = false,
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
    { label: "Project Update Feed", href: `/${projectId}/feed`, icon: Newspaper },
    { label: "Documents", href: `/${projectId}/documents`, icon: FolderOpen },
    { label: "Reports", href: `/${projectId}/reports`, icon: BarChart3 },
    { label: "Activity Log", href: `/${projectId}/activity-log`, icon: ClipboardList },
    { label: "Settings", href: `/${projectId}/settings`, icon: Settings },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const { pageTitleSuffix } = usePageTitle()

  // Determine current page title
  const activeNavItem = navItems.find((item) => pathname?.includes(item.href))
  let pageTitle = activeNavItem ? activeNavItem.label : "Dashboard"

  if (pathname.endsWith("/profile")) pageTitle = "My Profile"

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
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-surface-container-low transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:static lg:translate-x-0 lg:w-[260px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Link href={`/${projectId}/dashboard`} className="mt-4 mb-4 pl-1">
            <span className="text-[22px] font-bold text-[#1B4FFF] tracking-tight">Truzo</span>
          </Link>
          <button className="lg:hidden p-2 rounded-full hover:bg-surface-container-high" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-on-surface-variant" />
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
                    ? "bg-primary-container text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-container font-medium"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-on-surface"
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Portal Type Card */}
        <div className={cn("mx-3 my-3 px-4 space-y-2", isLoading && "animate-pulse")}>
          {projectStatus && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container`}>
              {projectStatus.replace("_", " ")}
            </span>
          )}
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Project Admin</p>
            <p className="text-sm font-semibold text-foreground truncate" title={projectName}>
              {projectName || " "}
            </p>
          </div>
        </div>

        {/* Sidebar Footer (User Info) */}
        <div className="mx-3 p-4 border-t border-outline-variant/40">
          <div className="flex items-center justify-between">
            <Link href={`/${projectId}/profile`} className="flex items-center gap-3 truncate group cursor-pointer p-1.5 rounded-xl hover:bg-[var(--surface-container-high)] transition-all duration-200 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-sm font-bold shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  profileName?.charAt(0)?.toUpperCase() || "A"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">
                  {profileName || "Admin"}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-destructive transition-all duration-200"
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
        <header className="flex h-16 items-center justify-between bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-full text-on-surface-variant lg:hidden hover:bg-surface-container-high"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-[22px] font-normal text-foreground">
              {pageTitle}{pageTitleSuffix ? <span className="text-on-surface-variant"> — {pageTitleSuffix}</span> : null}
            </h1>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            <NotificationBell projectId={projectId} />
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            {isArchived ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 w-full">
                <div className="max-w-md w-full bg-surface p-8 rounded-xl border border-outline-variant/40">
                  <div className="w-16 h-16 bg-error-container/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-on-surface mb-2">Project Archived</h2>
                  <p className="text-on-surface-variant mb-0">Communicate with the Admin.</p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
