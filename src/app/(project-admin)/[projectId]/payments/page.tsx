import { createClient } from "@/lib/supabase/server"
import { PaymentsClient } from "./PaymentsClient"

export const dynamic = "force-dynamic"

export default async function PaymentsPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  const { projectId } = params;

  const supabase = await createClient()

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select(`
       *,
       shareholder:shareholders(id, unit_flat, profiles(name, email)),
       milestone:milestones(id, name)
    `)
    .eq("payment_schedules.project_id", projectId)
    // Supabase JS inner join syntax limitation workaround: we might fetch all and filter, or use an RPC. 
    // If the schema directly links schedule_item to project, query is easy. 
    // In Sprint 2, maybe payment_schedules links them.

  // A safer approach: Since we can't deep inner-join perfectly in basic REST sometimes without the exact FK, 
  // let's fetch the schedules for the project first:
  const { data: schedules } = await supabase.from("payment_schedules").select("id").eq("project_id", projectId)
  const scheduleIds = schedules?.map(s => s.id) || []

  // Re-fetch using strictly isolated lists
  const { data: activeScheduleItems } = await supabase
    .from("schedule_items")
    .select(`
       *,
       shareholder:shareholders(id, unit_flat, profiles(name, email, phone)),
       milestone:milestones(id, name),
       penalties(*)
    `)
    .in("schedule_id", scheduleIds.length ? scheduleIds : ['00000000-0000-0000-0000-000000000000'])
    .order("due_date", { ascending: true })

  const { data: payments } = await supabase
    .from("payments")
    .select(`
       *,
       shareholder:shareholders(id, unit_flat, profiles(name)),
       recorded_by:profiles!recorded_by_id(name)
    `)
    // Because payments connect to shareholder, and shareholder connects to Project
    // Let's get project shareholders
  
  const { data: projectShareholders } = await supabase.from("shareholders").select("id, unit_flat, profiles(name)").eq("project_id", projectId)
  const shareholderIds = projectShareholders?.map(s => s.id) || []

  const { data: activePayments } = await supabase
    .from("payments")
    .select(`
       *,
       shareholder:shareholders(id, unit_flat, profiles(name)),
       recorded_by:profiles!recorded_by_id(name),
       schedule_item:schedule_items(milestone:milestones(name))
    `)
    .in("shareholder_id", shareholderIds.length ? shareholderIds : ['00000000-0000-0000-0000-000000000000'])
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
       <PaymentsClient 
          projectId={projectId}
          scheduleItems={activeScheduleItems || []}
          payments={activePayments || []}
          shareholders={projectShareholders || []}
       />
    </div>
  )
}
