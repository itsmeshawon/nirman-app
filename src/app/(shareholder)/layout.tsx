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
  User,
  ShieldCheck,
  AlertTriangle,
  Users,
  Flag
} from "lucide-react"
import NotificationBell from "@/components/NotificationBell"

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

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("name, avatar_url, email").eq("id", user.id).single()
        setProfile(profileData)

        // Check if user is a committee member in any project
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

  // Determine current page title
  const activeNavItem = navItems.find((item) => pathname?.includes(item.href))
  let pageTitle = activeNavItem ? activeNavItem.label : "Dashboard"

  if (pathname === "/my/profile") pageTitle = "My Profile"
  if (pathname === "/my/review") pageTitle = "Committee Review"
  if (pathname === "/my/defaulters") pageTitle = "Defaulter List"
  if (pathname === "/my/shareholders") pageTitle = "Shareholder List"
  if (pathname === "/my/milestones") pageTitle = "Project Milestones"

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
          <Link href={`/my/dashboard`} className="flex items-center gap-2">
            <span className="text-xl font-black text-[#4F46E5] tracking-tight">NirmaN</span>
          </Link>
          <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Info Area (No specific project name on global sidebar for multiple projects) */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50/50">
          <h2 className="font-semibold text-gray-900 truncate">
            Shareholder Portal
          </h2>
          <span className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800">
            Active
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname?.includes(item.href)
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

          {/* Governance / Committee Section */}
          {isCommitteeMember && (
            <div className="mt-8 pt-4 border-t border-gray-100">
               <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Governance</p>
               <Link
                href="/my/review"
                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === "/my/review"
                    ? "bg-[#F0FDFA] text-[#4F46E5] border-l-4 border-[#4F46E5]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShieldCheck
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    pathname === "/my/review" ? "text-[#4F46E5]" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  aria-hidden="true"
                />
                Committee Review
              </Link>
              <Link
                href="/my/defaulters"
                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mt-1 ${
                  pathname === "/my/defaulters"
                    ? "bg-[#F0FDFA] text-[#4F46E5] border-l-4 border-[#4F46E5]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AlertTriangle
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    pathname === "/my/defaulters" ? "text-[#4F46E5]" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  aria-hidden="true"
                />
                Defaulter
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer (User Info) */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Link href="/my/profile" className="flex items-center gap-3 truncate group cursor-pointer p-1 -m-1 rounded hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0 border border-indigo-100 overflow-hidden group-hover:border-indigo-300 transition-colors">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile?.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate group-hover:text-[#4F46E5] transition-colors">
                  {profile?.name || profile?.email || "Shareholder"}
                </span>
                <span className="mt-0.5 inline-flex items-center w-fit rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800 group-hover:bg-indigo-200 transition-colors">
                  Shareholder
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
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 shrink-0">
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
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
