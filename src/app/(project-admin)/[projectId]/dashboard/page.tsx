import { createClient } from "@/lib/supabase/server"
import { Users, ShieldCheck, Flag, Receipt, ArrowRight, Settings } from "lucide-react"
import Link from "next/link"
import { getUserProfile } from "@/lib/permissions"

export default async function ProjectDashboardPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // Fetch profile for welcome message
  const profile = await getUserProfile(supabase)

  // Fetch Project Details
  const { data: project } = await supabase
    .from("projects")
    .select("name, status")
    .eq("id", projectId)
    .single()

  // Fetch Quick Stats
  // 1. Shareholders
  const { count: shareholdersCount } = await supabase
    .from("shareholders")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)

  // 2. Committee Members
  const { count: committeeCount } = await supabase
    .from("committee_members")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("is_active", true)

  // 3. Milestones
  const { count: milestonesCount } = await supabase
    .from("milestones")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)

  // 4. Expense Categories
  const { count: categoriesCount } = await supabase
    .from("expense_categories")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)

  const stats = [
    {
      name: "Total Shareholders",
      value: shareholdersCount || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: `/${projectId}/shareholders`
    },
    {
      name: "Committee Members",
      value: committeeCount || 0,
      icon: ShieldCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: `/${projectId}/committee`
    },
    {
      name: "Milestones",
      value: milestonesCount || 0,
      icon: Flag,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
      href: `/${projectId}/milestones`
    },
    {
      name: "Expense Categories",
      value: categoriesCount || 0,
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: `/${projectId}/settings` // Maybe pointing to settings where categories might be managed later
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {profile.name}</h2>
        <p className="mt-1 text-gray-500">Here's an overview of your project.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                    <dd>
                      <div className="text-3xl font-semibold text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <div className="text-sm">
                <Link
                  href={stat.href}
                  className="font-medium text-[#0F766E] hover:text-teal-900 flex items-center justify-between"
                >
                  View Details
                   <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`/${projectId}/shareholders`}
          className="relative flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#0F766E] hover:ring-1 hover:ring-[#0F766E] transition-all shadow-sm group"
        >
          <div className="p-3 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
            <Users className="h-6 w-6 text-[#0F766E]" />
          </div>
          <span className="mt-4 font-medium text-gray-900">Manage Shareholders</span>
        </Link>

        <Link
          href={`/${projectId}/milestones`}
          className="relative flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#0F766E] hover:ring-1 hover:ring-[#0F766E] transition-all shadow-sm group"
        >
          <div className="p-3 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
            <Flag className="h-6 w-6 text-[#0F766E]" />
          </div>
          <span className="mt-4 font-medium text-gray-900">View Milestones</span>
        </Link>

        <Link
          href={`/${projectId}/settings`}
          className="relative flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:border-[#0F766E] hover:ring-1 hover:ring-[#0F766E] transition-all shadow-sm group"
        >
           <div className="p-3 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
            <Settings className="h-6 w-6 text-[#0F766E]" />
          </div>
          <span className="mt-4 font-medium text-gray-900">Project Settings</span>
        </Link>
      </div>
    </div>
  )
}
