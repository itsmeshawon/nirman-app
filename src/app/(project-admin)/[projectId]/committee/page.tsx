import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { CommitteeClient } from "./CommitteeClient"

export default async function CommitteePage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // 1. Fetch Approval Config
  const { data: config } = await supabase
    .from("approval_configs")
    .select("rule")
    .eq("project_id", projectId)
    .single()

  const currentRule = config?.rule || "MAJORITY"

  // 2. Fetch Active Committee Members with their shareholder & profile data
  const { data: members, error } = await getSupabaseAdmin()
    .from("committee_members")
    .select(`
      id,
      created_at,
      shareholders (
        unit_flat,
        profiles (
          name,
          email
        )
      )
    `)
    .eq("project_id", projectId)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching committee members:", error)
  }

  const memberShareholderIds = members?.map((m: any) => m.shareholders?.id) || []

  // 3. Fetch Active Shareholders NOT already on the committee
  // Workaround: fetch all active, then filter in memory since Supabase RPC/complex query isn't strictly needed for small lists yet.
  const { data: allActiveShareholders } = await getSupabaseAdmin()
    .from("shareholders")
    .select(`
      id,
      user_id,
      unit_flat,
      profiles (
        name,
        email
      )
    `)
    .eq("project_id", projectId)
    .eq("status", "ACTIVE")

  const availableShareholders = (allActiveShareholders || []).filter(
    (sh: any) => !members?.some((m: any) => m.shareholders?.unit_flat === sh.unit_flat) // Simplest reliable match here since joins vary
  )


  return (
    <CommitteeClient
      projectId={projectId}
      currentRule={currentRule}
      members={members || []}
      availableShareholders={availableShareholders}
    />
  )
}
