import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
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
  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name, address, area, status, start_date, created_at, package_id, building_meta, packages(id, name, features)")
    .order("created_at", { ascending: false })
    .limit(5)

  if (!projects?.length) return []

  const projectIds = projects.map((p: any) => p.id)

  const [{ data: shareholders }, { data: projectAdmins }] = await Promise.all([
    supabaseAdmin.from("shareholders").select("project_id").in("project_id", projectIds),
    supabaseAdmin.from("project_admins").select("project_id").in("project_id", projectIds),
  ])

  const shCountMap: Record<string, number> = {}
  for (const s of shareholders ?? []) {
    shCountMap[s.project_id] = (shCountMap[s.project_id] ?? 0) + 1
  }
  const adminCountMap: Record<string, number> = {}
  for (const a of projectAdmins ?? []) {
    adminCountMap[a.project_id] = (adminCountMap[a.project_id] ?? 0) + 1
  }

  return (projects as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address ?? null,
    area: p.area ?? null,
    status: p.status,
    start_date: p.start_date ?? null,
    created_at: p.created_at,
    package_id: p.package_id ?? null,
    package_name: p.packages?.name ?? null,
    package_features: p.packages?.features ?? [],
    salesperson_name: p.building_meta?.salesperson_name ?? null,
    shareholderCount: shCountMap[p.id] ?? 0,
    adminCount: adminCountMap[p.id] ?? 0,
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
    <Card className="border border-outline-variant/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-on-surface-variant font-medium">{label}</p>
            <p className="text-3xl font-bold text-on-surface mt-1">{value}</p>
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
        <h1 className="text-2xl font-bold text-on-surface">Platform Dashboard</h1>
        <p className="text-on-surface-variant text-sm mt-1">Overview of all NirmaN projects and activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          icon={FolderOpen}
          iconBg="bg-primary-container/20"
          iconColor="text-primary"
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={Building2}
          iconBg="bg-primary-container/20"
          iconColor="text-primary"
        />
        <StatCard
          label="Total Shareholders"
          value={stats.totalShareholders}
          icon={Users}
          iconBg="bg-tertiary-container/20"
          iconColor="text-tertiary"
        />
        <StatCard
          label="Last Activity"
          value={lastActivityLabel}
          icon={Activity}
          iconBg="bg-tertiary-container/20"
          iconColor="text-tertiary"
        />
      </div>

      {/* Recent Projects */}
      <Card className="border border-outline-variant/30">
        <CardHeader className="pb-3 border-b border-outline-variant/30">
          <CardTitle className="text-base font-semibold text-on-surface">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RecentProjectsTable data={recentProjects} />
        </CardContent>
      </Card>
    </div>
  )
}
