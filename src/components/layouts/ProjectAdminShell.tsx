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
  AlertTriangle,
  ClipboardList
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { ThemeToggle } from "@/components/ThemeToggle"
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
    { label: "Activity Log", href: `/${projectId}/activity-log`, icon: ClipboardList },
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
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-surface-container-low transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:static lg:translate-x-0 lg:w-[260px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Link href={`/${projectId}/dashboard`} className="flex items-center gap-2 mt-4 mb-4 pl-1 text-on-surface">
            <svg width="152" height="42" viewBox="0 0 152 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto" aria-label="NirmaN">
              <path d="M135.417 41.1V25H139.051L149.286 36.5L148.665 36.385C148.573 35.833 148.504 35.3117 148.458 34.821C148.412 34.315 148.366 33.8243 148.32 33.349C148.289 32.8737 148.259 32.406 148.228 31.946C148.213 31.486 148.205 31.0107 148.205 30.52C148.205 30.0293 148.205 29.5157 148.205 28.979V25H152V41.1H148.32L137.717 29.232L138.752 29.393C138.813 29.8377 138.867 30.2593 138.913 30.658C138.959 31.0413 138.997 31.4247 139.028 31.808C139.074 32.1913 139.112 32.5823 139.143 32.981C139.174 33.3643 139.189 33.786 139.189 34.246C139.204 34.6907 139.212 35.1813 139.212 35.718V41.1H135.417Z" fill="currentColor"/>
              <path d="M115.42 41.1L122.688 25H126.207L133.452 41.1H129.45L125.448 32.153C125.295 31.831 125.149 31.509 125.011 31.187C124.888 30.8497 124.766 30.52 124.643 30.198C124.52 29.8607 124.405 29.531 124.298 29.209C124.191 28.8717 124.091 28.5497 123.999 28.243L124.804 28.22C124.697 28.5727 124.589 28.91 124.482 29.232C124.375 29.554 124.252 29.8837 124.114 30.221C123.991 30.543 123.861 30.865 123.723 31.187C123.585 31.509 123.447 31.8387 123.309 32.176L119.33 41.1H115.42ZM118.824 38.156L120.066 35.212H128.737L129.565 38.156H118.824Z" fill="currentColor"/>
              <path d="M95.4611 41.1V25H98.9571L105.65 34.292L103.304 34.269L110.02 25H113.47V41.1H109.675V35.948C109.675 34.6293 109.706 33.418 109.767 32.314C109.828 31.1947 109.951 30.0677 110.135 28.933L110.526 30.198L105.19 37.19H103.672L98.3591 30.175L98.7961 28.933C98.9801 30.037 99.1027 31.141 99.1641 32.245C99.2254 33.349 99.2561 34.5833 99.2561 35.948V41.1H95.4611Z" fill="currentColor"/>
              <path d="M77.2462 41.1V25H85.6411C86.8218 25 87.8491 25.2147 88.7231 25.644C89.5971 26.0733 90.2718 26.679 90.7471 27.461C91.2378 28.2277 91.4831 29.1247 91.4831 30.152C91.4831 31.164 91.2225 32.084 90.7011 32.912C90.1951 33.7247 89.4975 34.361 88.6081 34.821C87.7341 35.281 86.7528 35.511 85.6641 35.511H80.9722V41.1H77.2462ZM87.8031 41.1L82.9271 33.832L86.9751 33.257L92.3111 41.1H87.8031ZM80.9722 32.521H85.2501C85.6948 32.521 86.0858 32.429 86.4231 32.245C86.7758 32.061 87.0518 31.808 87.2511 31.486C87.4658 31.1487 87.5731 30.7653 87.5731 30.336C87.5731 29.9067 87.4581 29.5387 87.2281 29.232C87.0135 28.9253 86.7221 28.6877 86.3541 28.519C85.9861 28.3503 85.5568 28.266 85.0661 28.266H80.9722V32.521Z" fill="currentColor"/>
              <path d="M61.7518 41.1V37.719H65.3628V28.381H61.7518V25H72.9068V28.381H69.2728V37.719H72.9068V41.1H61.7518Z" fill="currentColor"/>
              <path d="M40.839 41.1V25H44.473L54.708 36.5L54.087 36.385C53.995 35.833 53.926 35.3117 53.88 34.821C53.834 34.315 53.788 33.8243 53.742 33.349C53.7113 32.8737 53.6806 32.406 53.65 31.946C53.6346 31.486 53.627 31.0107 53.627 30.52C53.627 30.0293 53.627 29.5157 53.627 28.979V25H57.422V41.1H53.742L43.139 29.232L44.174 29.393C44.2353 29.8377 44.289 30.2593 44.335 30.658C44.381 31.0413 44.4193 31.4247 44.45 31.808C44.496 32.1913 44.5343 32.5823 44.565 32.981C44.5957 33.3643 44.611 33.786 44.611 34.246C44.6263 34.6907 44.634 35.1813 44.634 35.718V41.1H40.839Z" fill="currentColor"/>
              <path d="M25.1846 9.37012V20.7676L32.1104 25V37.4717H34V41.249H0V37.4717H1.88867V18.9238L10.7031 11.9971V0L25.1846 9.37012ZM5.66602 20.7598V37.4717H10.7031V16.8018L5.66602 20.7598ZM14.4814 37.4717H28.333V26.5L21.4072 22.6924V11.4248L14.4814 6.94336V37.4717Z" fill="currentColor"/>
            </svg>
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
        <div className="mx-3 my-3 px-4 space-y-2">
          {projectStatus && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container`}>
              {projectStatus.replace("_", " ")}
            </span>
          )}
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Project Admin</p>
            <p className="text-sm font-semibold text-foreground truncate" title={projectName}>
              {projectName}
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
                  {profileName || user?.email}
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
            <h1 className="text-[22px] font-normal text-foreground">{pageTitle}</h1>
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
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
