import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { PaymentsClient } from "./PaymentsClient"

export const dynamic = "force-dynamic"

export default async function PaymentsPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  const { projectId } = params;

  const supabase = await createClient()

  const { data: schedules } = await supabase.from("payment_schedules").select("id").eq("project_id", projectId)
  const scheduleIds = schedules?.map(s => s.id) || []

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

  const { data: projectShareholders } = await supabase.from("shareholders").select("id, unit_flat, profiles(name)").eq("project_id", projectId)
  const shareholderIds = projectShareholders?.map(s => s.id) || []

  const { data: activePayments } = await supabase
    .from("payments")
    .select(`
       *,
       shareholder:shareholders(id, unit_flat, profiles(name)),
       recorded_by:profiles!recorded_by_id(name),
       schedule_item:schedule_items(milestone:milestones(name)),
       proof:payment_proofs(attachment_url, attachment_name)
    `)
    .in("shareholder_id", shareholderIds.length ? shareholderIds : ['00000000-0000-0000-0000-000000000000'])
    .order("created_at", { ascending: false })

  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, name")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  // Fetch payment proofs — use supabaseAdmin since RLS requires project_admin check
  const { data: paymentProofs } = await getSupabaseAdmin()
    .from("payment_proofs")
    .select(`
      *,
      shareholder:shareholders(id, unit_flat, profiles(name, email)),
      schedule_item:schedule_items(id, amount, due_date, milestone:milestones(name))
    `)
    .eq("project_id", projectId)
    .order("submitted_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
       <PaymentsClient
          projectId={projectId}
          scheduleItems={activeScheduleItems || []}
          payments={activePayments || []}
          shareholders={projectShareholders || []}
          milestones={milestones || []}
          paymentProofs={paymentProofs || []}
       />
    </div>
  )
}
