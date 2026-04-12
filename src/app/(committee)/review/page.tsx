import { createClient } from "@/lib/supabase/server"
import { ReviewClient } from "./ReviewClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CommitteeReviewPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Fetch projects where user is an active committee member
  const { data: memberRecords } = await supabase
    .from("committee_members")
    .select("project_id, project:projects(id, name)")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (!memberRecords || memberRecords.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-12 bg-white rounded-xl shadow-sm border py-24">
         <h1 className="text-2xl font-bold text-gray-900">Governance Review</h1>
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

  // 2. Fetch SUBMITTED expenses for those projects
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
       *,
       category:expense_categories(id, name),
       attachments:expense_attachments(*)
    `)
    .in("project_id", projectIds)
    .eq("status", "SUBMITTED")
    .order("updated_at", { ascending: true })

  // 3. Fetch all committee counts and active approvals for the progress indicators
  // For each submitted expense, we need total active committee members in that project, and current approval count.
  const expensesWithProgress = await Promise.all((expenses || []).map(async (exp) => {
     const { count: totalMembers } = await supabase
       .from("committee_members")
       .select("*", { count: 'exact', head: true })
       .eq("project_id", exp.project_id)
       .eq("is_active", true)

     const { count: totalApprovals } = await supabase
       .from("expense_approvals")
       .select("*", { count: 'exact', head: true })
       .eq("expense_id", exp.id)
       .eq("action", "APPROVED")

     return {
        ...exp,
        projectName: projectMap[exp.project_id] || "Unknown Project",
        totalMembers: totalMembers || 1,
        totalApprovals: totalApprovals || 0
     }
  }))

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Expense Reviews</h1>
        <p className="text-gray-500 mt-1">Review and approve expenditures across your committee assignments.</p>
      </div>
      <ReviewClient expenses={expensesWithProgress} />
    </div>
  )
}
