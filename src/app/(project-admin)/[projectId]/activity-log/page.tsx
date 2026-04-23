import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"
import { redirect } from "next/navigation"
import ActivityLogClient from "./ActivityLogClient"

export const dynamic = "force-dynamic"

export default async function ActivityLogPage(props: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    await requireProjectAdmin(supabase, projectId)
  } catch {
    redirect(`/${projectId}/dashboard`)
  }

  const { data: logs } = await getSupabaseAdmin()
    .from("audit_logs")
    .select("id, action, entity_type, details, created_at, user_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(500)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Activity Log</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Full audit trail of all actions taken in this project.
        </p>
      </div>
      <ActivityLogClient logs={logs ?? []} />
    </div>
  )
}
