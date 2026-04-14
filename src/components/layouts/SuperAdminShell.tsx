"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, LogOut, Menu, X, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Packages", href: "/packages", icon: Package },
]

interface SuperAdminShellProps {
  children: React.ReactNode
  userName: string
  avatarUrl?: string | null
}

export default function SuperAdminShell({ children, userName, avatarUrl }: SuperAdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/login")
  }

  const activeNavItem = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  let pageTitle = activeNavItem ? activeNavItem.label : "Dashboard"
  if (pathname === "/profile") pageTitle = "My Profile"

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo — fixed h-16 matching ProjectAdminShell */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-outline-variant/50">
        <Link href="/dashboard">
          <span className="text-xl font-bold text-primary tracking-tight">NirmaN</span>
        </Link>
        <button className="lg:hidden p-2 rounded-full hover:bg-surface-variant/50" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5 text-on-surface-variant" />
        </button>
      </div>

      {/* Role Info Area */}
      <div className="px-5 py-4 border-b border-outline-variant/50">
        <h2 className="font-semibold text-on-surface truncate">Platform Admin</h2>
        <span className="mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary-container text-on-secondary-container">
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface"
              )}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-on-primary-container" : "text-on-surface-variant group-hover:text-on-surface"
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — identical layout to ProjectAdminShell */}
      <div className="border-t border-outline-variant/50 p-4">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-md hover:bg-surface-variant/50 transition-all duration-200 flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName?.charAt(0)?.toUpperCase() ?? "A"
              )}
            </div>
            <div className="flex flex-col truncate min-w-0">
              <span className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">{userName}</span>
              <span className="mt-0.5 inline-flex items-center w-fit rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-medium text-on-secondary-container">
                Super Admin
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="ml-2 rounded-full p-2 text-on-surface-variant hover:bg-error-container/50 hover:text-on-error-container transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:shrink-0 bg-surface border-r border-outline-variant/50">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/32 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-surface shadow-m3-5 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between bg-surface border-b border-outline-variant/50 px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="mr-3 p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-on-surface">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
