import { createClient } from "@/lib/supabase/server"
import { ShareholderExpensesClient } from "./ShareholderExpensesClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ShareholderExpensesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Fetch projects where user is a shareholder
  const { data: shareholderRecords } = await supabase
    .from("shareholders")
    .select("project_id, project:projects(id, name)")
    .eq("user_id", user.id)

  if (!shareholderRecords || shareholderRecords.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-12 bg-white rounded-[1.25rem] shadow-eos-sm border py-24">
         <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
         <p className="text-gray-500 mt-2">You don't have any active project associations yet.</p>
      </div>
    )
  }

  const projectIds = shareholderRecords.map(r => r.project_id)

  // 2. Fetch PUBLISHED expenses for those projects
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
       *,
       category:expense_categories(id, name),
       attachments:expense_attachments(*)
    `)
    .in("project_id", projectIds)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Project Expenses</h1>
        <p className="text-gray-500 mt-1">Full transparent visibility into approved and finalized project expenditures.</p>
      </div>
      <ShareholderExpensesClient expenses={expenses || []} />
    </div>
  )
}
