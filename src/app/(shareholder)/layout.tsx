"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, FileText, Bell, Menu, X, Receipt, LogOut } from "lucide-react"
import NotificationBell from "@/components/NotificationBell"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/my/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my/payments", label: "My Payments", icon: CreditCard },
  { href: "/my/expenses", label: "Expenses", icon: Receipt },
  { href: "/my/documents", label: "Documents", icon: FileText },
  { href: "/my/feed", label: "Updates", icon: Bell },
]

export default function ShareholderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const NavLinks = () => (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-teal-700 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-[#0F4C45] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0">
          <span className="text-white font-bold text-lg tracking-tight">NirmaN</span>
          <span className="ml-1.5 text-xs bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded font-medium">My Portal</span>
        </div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavLinks />
        </nav>
        {/* Sign out */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0F4C45] flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
              <span className="text-white font-bold text-lg">NirmaN</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <NavLinks />
            </nav>
            <div className="border-t border-white/10 p-3">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 sticky top-0 z-20 gap-4">
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-800 md:hidden">NirmaN My Portal</h1>
          <div className="flex-1" />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
