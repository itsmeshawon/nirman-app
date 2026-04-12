import { createClient } from "@/lib/supabase/server"
import { formatDistanceToNow } from "date-fns"
import { Building2, Users, Activity, FolderOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RecentProjectsTable, { type ProjectRow } from "@/components/super-admin/RecentProjectsTable"

async function getPlatformStats() {
  const supabase = await createClient()

  const [projectsRes, shareholdersRes, auditRes] = await Promise.all([
    supabase.from("projects").select("id, status"),
    supabase.from("shareholders").select("id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("created_at").order("created_at", { ascending: false }).limit(1),
  ])

  const projects = projectsRes.data ?? []
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => ["ACTIVE", "PILOT"].includes(p.status)).length,
    totalShareholders: shareholdersRes.count ?? 0,
    lastActivity: auditRes.data?.[0]?.created_at ?? null,
  }
}

async function getRecentProjects(): Promise<ProjectRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("id, name, status, created_at, shareholders(id)")
    .order("created_at", { ascending: false })
    .limit(10)

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    shareholderCount: Array.isArray(p.shareholders) ? p.shareholders.length : 0,
    created_at: p.created_at,
  }))
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-100">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function SuperAdminDashboardPage() {
  const [stats, recentProjects] = await Promise.all([
    getPlatformStats(),
    getRecentProjects(),
  ])

  const lastActivityLabel = stats.lastActivity
    ? formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true })
    : "No activity yet"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all NirmaN projects and activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          icon={FolderOpen}
          iconBg="bg-teal-50"
          iconColor="text-[#0F766E]"
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={Building2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Total Shareholders"
          value={stats.totalShareholders}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Last Activity"
          value={lastActivityLabel}
          icon={Activity}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Recent Projects */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RecentProjectsTable data={recentProjects} />
        </CardContent>
      </Card>
    </div>
  )
}
