import { createClient } from "@/lib/supabase/server"
import { ShareholderPaymentsClient } from "./ShareholderPaymentsClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function MyPaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Find the shareholder record for this user
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const { data: shareholder } = await supabase.from("shareholders").select("*").eq("user_id", user.id).single()

  if (!shareholder) {
    return <div className="p-8 text-center">You are not mapped as a shareholder for any project yet.</div>
  }

  // Fetch only THEIR isolated schedule_items and penalties
  const { data: myScheduleItems } = await supabase
    .from("schedule_items")
    .select(`
       *,
       milestone:milestones(id, name),
       penalties(*)
    `)
    .eq("shareholder_id", shareholder.id)
    .order("due_date", { ascending: true })

  // Fetch only THEIR isolated payments
  const { data: myPayments } = await supabase
    .from("payments")
    .select("*")
    .eq("shareholder_id", shareholder.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
       <ShareholderPaymentsClient 
          scheduleItems={myScheduleItems || []}
          payments={myPayments || []}
          shareholder={shareholder}
       />
    </div>
  )
}
