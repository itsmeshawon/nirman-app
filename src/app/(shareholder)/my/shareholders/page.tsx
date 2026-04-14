import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { ShareholdersList } from "./ShareholdersList"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ShareholderDirectoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Identify which project the current user belongs to
  const { data: userShareholderRecords } = await supabaseAdmin
    .from("shareholders")
    .select("project_id")
    .eq("user_id", user.id)

  if (!userShareholderRecords || userShareholderRecords.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-12 bg-surface rounded-[1.25rem] shadow-eos-sm border py-24">
         <h2 className="text-2xl font-bold text-on-surface">Shareholder List</h2>
         <p className="text-on-surface-variant mt-2">You are not registered as a shareholder in any projects.</p>
      </div>
    )
  }

  const projectIds = userShareholderRecords.map(r => r.project_id)

  // 2. Fetch all shareholders for those projects
  const { data: neighbors } = await supabaseAdmin
    .from("shareholders")
    .select(`
      id,
      unit_flat,
      ownership_pct,
      status,
      project:projects(id, name),
      profiles(
        id,
        name,
        email,
        phone,
        avatar_url,
        profession,
        organization
      )
    `)
    .in("project_id", projectIds)
    .eq("status", "ACTIVE") // Usually residents only want to see active neighbors
    .order("unit_flat", { ascending: true })

  // 3. Fetch committee members to highlight them
  const { data: committeeData } = await supabaseAdmin
    .from("committee_members")
    .select("shareholder_id")
    .in("project_id", projectIds)
    .eq("is_active", true)

  const committeeShareholderIds = (committeeData || []).map(c => c.shareholder_id)

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Project Shareholders</h1>
        <p className="text-on-surface-variant mt-1">Connect with your neighbors and view project unit owners.</p>
      </div>
      <ShareholdersList 
        data={neighbors || []} 
        committeeShareholderIds={committeeShareholderIds}
      />
    </div>
  )
}
