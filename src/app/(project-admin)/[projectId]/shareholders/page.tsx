import { createClient } from "@/lib/supabase/server"
import { ShareholdersTable } from "./ShareholdersTable"

export default async function ShareholdersPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // Fetch shareholders with their profile data
  const { data: shareholders, error } = await supabase
    .from("shareholders")
    .select(`*, profiles (name, email, phone)`)
    .eq("project_id", projectId)
    .order("unit_flat", { ascending: true })

  if (error) {
    console.error("Error fetching shareholders:", error)
    return <div>Failed to load shareholders</div>
  }

  // Fetch active committee members to know which shareholders hold a committee seat
  const { data: committeeMembers } = await supabase
    .from("committee_members")
    .select("shareholder_id")
    .eq("project_id", projectId)
    .eq("is_active", true)

  const committeeShareholderIds = (committeeMembers ?? [])
    .map((cm) => cm.shareholder_id)
    .filter(Boolean) as string[]

  return (
    <div className="w-full">
      <ShareholdersTable
        projectId={projectId}
        data={shareholders || []}
        committeeShareholderIds={committeeShareholderIds}
      />
    </div>
  )
}
