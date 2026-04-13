import { createClient } from "@/lib/supabase/server"
import { ProjectSettingsClient } from "./ProjectSettingsClient"

export default async function SettingsPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // 1. Fetch Project profile
  const { data: project, error: pError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (pError) return <div>Error loading project profile.</div>

  // 2. Fetch Payment Schedule settings
  const { data: paySched } = await supabase
    .from("payment_schedules")
    .select("*")
    .eq("project_id", projectId)
    .single() // Assume 1 active for now as per schema design intent for Sprint 2

  // 3. Fetch Penalty Config
  const { data: penalty } = await supabase
    .from("penalty_configs")
    .select("*")
    .eq("project_id", projectId)
    .single()

  // 4. Fetch Notification Config
  const { data: notify } = await supabase
    .from("notification_configs")
    .select("*")
    .eq("project_id", projectId)
    .single()

  // 5. Fetch Admin Profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single()

  return (
    <ProjectSettingsClient
      projectId={projectId}
      project={project || {}}
      paymentSchedule={paySched || {}}
      penaltyConfig={penalty || {}}
      notificationConfig={notify || {}}
      adminProfile={adminProfile || {}}
    />
  )
}
