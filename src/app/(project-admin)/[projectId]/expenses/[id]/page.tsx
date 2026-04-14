import { createClient } from "@/lib/supabase/server"
import { ExpenseDetailClient } from "./ExpenseDetailClient"

export const dynamic = "force-dynamic"

export default async function ExpenseDetailPage(props: { params: Promise<{ projectId: string; id: string }> }) {
  const params = await props.params;

  const {
    projectId,
    id
  } = params;

  const supabase = await createClient()

  // 1. Fetch exact expense detail bypassing api for direct server render
  const { data: expense } = await supabase
    .from("expenses")
    .select(`
      *,
      category:expense_categories(id, name),
      milestone:milestones(id, name),
      attachments:expense_attachments(*),
      approvals:expense_approvals(*, user:profiles(name, email, avatar_url))
    `)
    .eq("id", id)
    .eq("project_id", projectId)
    .single()

  if (!expense) {
    return <div className="p-8 text-center text-on-surface-variant">Expense not found</div>
  }

  // Sort approvals by date
  if (expense.approvals) {
    expense.approvals.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // 2. Fetch Milestones and Categories for Edit Form
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, name")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  const { data: categories } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("project_id", projectId)

  return (
     <ExpenseDetailClient 
       projectId={projectId} 
       expense={expense} 
       milestones={milestones || []} 
       categories={categories || []} 
     />
  )
}
