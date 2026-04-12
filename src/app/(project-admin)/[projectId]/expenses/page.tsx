import { createClient } from "@/lib/supabase/server"
import { ExpensesClient } from "./ExpensesClient"

export const dynamic = "force-dynamic"

export default async function ExpensesPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // Note: we let the API handle strict access. This is a server component so RLS will apply.
  
  // 1. Fetch Expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      category:expense_categories(id, name),
      milestone:milestones(id, name)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  // 2. Fetch Milestones for Form
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, name")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  // 3. Fetch Categories for Form
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("id, name")
    .eq("project_id", projectId)

  return (
    <div className="max-w-7xl mx-auto">
      <ExpensesClient 
        projectId={projectId} 
        expenses={expenses || []}
        milestones={milestones || []}
        categories={categories || []}
      />
    </div>
  )
}
