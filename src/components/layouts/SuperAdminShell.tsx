"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, LogOut, Menu, X, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
}

export default function SuperAdminShell({ children, userName }: SuperAdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/login")
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-xl font-bold text-[#4F46E5] tracking-tight">NirmaN</p>
        <p className="text-xs text-gray-400 mt-0.5">Platform Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-[#4F46E5] bg-indigo-50 text-[#4F46E5] ml-0 pl-[10px]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#4F46E5]" : "text-gray-400")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-100 px-4 py-4">
        <Link 
          href="/profile" 
          className="flex items-center gap-3 mb-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-[#4F46E5] text-sm font-semibold shrink-0 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
            {userName?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#4F46E5] transition-colors">{userName}</p>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-[#4F46E5]">
              Super Admin
            </span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-xl transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-lg font-bold text-[#4F46E5]">NirmaN</p>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 shrink-0">
          <div /> {/* spacer / breadcrumb placeholder */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{userName}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
