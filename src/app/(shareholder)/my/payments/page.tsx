import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { ShareholderPaymentsClient } from "./ShareholderPaymentsClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function MyPaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: shareholder } = await supabase.from("shareholders").select("*").eq("user_id", user.id).single()

  if (!shareholder) {
    return <div className="p-8 text-center">You are not mapped as a shareholder for any project yet.</div>
  }

  const [
    { data: myScheduleItems },
    { data: myPayments },
    { data: myProofs },
  ] = await Promise.all([
    supabase
      .from("schedule_items")
      .select(`
         *,
         milestone:milestones(id, name),
         penalties(*)
      `)
      .eq("shareholder_id", shareholder.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("payments")
      .select("*, proof:payment_proofs(attachment_url, attachment_name)")
      .eq("shareholder_id", shareholder.id)
      .order("created_at", { ascending: false }),
    getSupabaseAdmin()
      .from("payment_proofs")
      .select(`
        *,
        schedule_item:schedule_items(id, amount, due_date, milestone:milestones(name))
      `)
      .eq("shareholder_id", shareholder.id)
      .order("submitted_at", { ascending: false }),
  ])

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
       <ShareholderPaymentsClient
          scheduleItems={myScheduleItems || []}
          payments={myPayments || []}
          shareholder={shareholder}
          myProofs={myProofs || []}
       />
    </div>
  )
}
