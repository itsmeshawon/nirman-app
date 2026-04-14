"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, LogOut, Menu, X, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/ThemeToggle"

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
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <Link href="/dashboard">
          <span className="text-[24px] font-normal text-primary tracking-tight">NirmaN</span>
        </Link>
        <button className="lg:hidden p-2 rounded-full hover:bg-surface-container-high" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5 text-on-surface-variant" />
        </button>
      </div>

      {/* Role Info Area */}
      <div className="px-6 py-4">
        <h2 className="text-[14px] font-medium text-foreground truncate">Platform Admin</h2>
        <span className="mt-1 inline-flex items-center rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex h-12 items-center rounded-full px-4 text-sm transition-all duration-200",
                isActive
                  ? "bg-primary-container text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container font-medium"
              )}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-on-surface-variant"
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — refined layout */}
      <div className="p-4 border-t border-outline-variant/40 mx-2 mb-2 rounded-2xl bg-white/40">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-3 truncate group cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-white/60 transition-all duration-200 flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-sm font-bold shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName?.charAt(0)?.toUpperCase() ?? "A"
              )}
            </div>
            <div className="flex flex-col truncate min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Super Admin
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="ml-2 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-destructive transition-all duration-200"
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
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:shrink-0 bg-surface-container-low">
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
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-surface-container-low transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="mr-3 p-2 rounded-full text-on-surface-variant lg:hidden hover:bg-surface-container-high"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-[22px] font-normal text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
