import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { DefaultersClient } from "./DefaultersClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DefaultersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Fetch projects where user is an active committee member
  const { data: memberRecords } = await supabaseAdmin
    .from("committee_members")
    .select("project_id, project:projects(id, name)")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (!memberRecords || memberRecords.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-12 bg-white rounded-[1.25rem] shadow-eos-sm border py-24">
         <h2 className="text-2xl font-bold text-gray-900">Defaulter List</h2>
         <p className="text-gray-500 mt-2">You are not an active committee member on any projects.</p>
      </div>
    )
  }

  const projectIds = memberRecords.map(r => r.project_id)
  
  // Mapping for project names
  const projectMap = memberRecords.reduce((acc, r: any) => {
     if (r.project) acc[r.project_id] = r.project.name
     return acc
  }, {} as Record<string, string>)

  // 2. Fetch payment_schedules first (since schedule_items doesn't have project_id)
  const { data: schedules } = await supabaseAdmin
    .from("payment_schedules")
    .select("id, project_id")
    .in("project_id", projectIds)

  const scheduleIds = schedules?.map(s => s.id) || []

  // 3. Fetch OVERDUE items for those schedules
  const { data: overdueItems } = await supabaseAdmin
    .from("schedule_items")
    .select(`
      id,
      amount,
      due_date,
      status,
      schedule_id,
      shareholder:shareholders (
        id,
        unit_flat,
        project_id,
        profiles (
          name,
          email,
          phone
        )
      ),
      penalties (
        amount,
        is_waived
      )
    `)
    .in("schedule_id", scheduleIds.length ? scheduleIds : ['00000000-0000-0000-0000-000000000000'])
    .eq("status", "OVERDUE")
    .order("due_date", { ascending: true })

  // 4. Fetch all payments related to overdue items
  const overdueItemIds = overdueItems?.map(i => i.id) || []
  const { data: payments } = overdueItemIds.length > 0 ? await supabaseAdmin
    .from("payments")
    .select("schedule_item_id, amount")
    .in("schedule_item_id", overdueItemIds)
    .eq("status", "VERIFIED") : { data: [] }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Defaulter List</h1>
        <p className="text-gray-500 mt-1">Shareholders with overdue collections across your assigned projects.</p>
      </div>
      <DefaultersClient 
        overdueItems={overdueItems || []} 
        payments={payments || []} 
        projectMap={projectMap} 
      />
    </div>
  )
}
