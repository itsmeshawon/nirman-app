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
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"

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
  const pageTitle = activeNavItem ? activeNavItem.label : "Dashboard"

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
      case "PILOT":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200">
          <Link href={`/${projectId}/dashboard`} className="flex items-center gap-2">
            <span className="text-xl font-black text-[#4F46E5] tracking-tight">NirmaN</span>
          </Link>
          <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Project Info Area */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50/50">
          <h2 className="font-semibold text-gray-900 truncate" title={projectName}>
            {projectName}
          </h2>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
              projectStatus
            )}`}
          >
            {projectStatus.replace("_", " ")}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname?.includes(item.href) // Use includes instead of startsWith to avoid /dashboard matching /
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#F0FDFA] text-[#4F46E5] border-l-4 border-[#4F46E5]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-[#4F46E5]" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-3 truncate group cursor-pointer p-1 -m-1 rounded hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0 border border-indigo-100 overflow-hidden group-hover:border-indigo-300 transition-colors">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  profileName?.charAt(0)?.toUpperCase() || "A"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate group-hover:text-[#4F46E5] transition-colors">
                  {profileName || user?.email}
                </span>
                <span className="mt-0.5 inline-flex items-center w-fit rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800 group-hover:bg-indigo-200 transition-colors">
                  Project Admin
                </span>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
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
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              className="mr-3 text-gray-500 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Only Project Name Snippet */}
            <div className="hidden lg:flex lg:items-center lg:gap-2 mr-2">
                <span className="text-sm text-gray-500">Project:</span>
                <span className="text-sm font-medium text-gray-900">{projectName}</span>
            </div>
            <NotificationBell projectId={projectId} />
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
