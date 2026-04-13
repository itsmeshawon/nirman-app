import { createClient } from "@/lib/supabase/server"
import { DefaultersClient } from "./DefaultersClient"

export const dynamic = "force-dynamic"

export default async function ProjectDefaultersPage(props: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await props.params
  const supabase = await createClient()

  // 1. Identify the project's schedules
  const { data: schedules } = await supabase
    .from("payment_schedules")
    .select("id")
    .eq("project_id", projectId)
  
  const scheduleIds = schedules?.map(s => s.id) || []

  // 2. Fetch overdue schedule items for these schedules
  const { data: overdueItems } = await supabase
    .from("schedule_items")
    .select(`
      *,
      shareholder:shareholders (
        *,
        profiles (name, email, phone)
      ),
      penalties (*)
    `)
    .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "OVERDUE")
    .order("due_date", { ascending: true })

  // 3. Fetch all payments for project shareholders (to calculate precise principal due)
  const { data: projectShareholders } = await supabase
    .from("shareholders")
    .select("id")
    .eq("project_id", projectId)

  const shareholderIds = projectShareholders?.map(s => s.id) || []

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .in("shareholder_id", shareholderIds.length ? shareholderIds : ["00000000-0000-0000-0000-000000000000"])

  return (
    <div className="w-full">
      <DefaultersClient 
        projectId={projectId}
        overdueItems={overdueItems || []} 
        payments={payments || []} 
      />
    </div>
  )
}
