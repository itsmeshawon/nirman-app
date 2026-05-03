import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try { await requireProjectAdmin(supabase, projectId) } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [{ data: expenses }, { data: milestones }, { data: categories }] = await Promise.all([
    supabase.from("expenses").select("*, category:expense_categories(id, name), milestone:milestones(id, name)").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("milestones").select("id, name").eq("project_id", projectId).order("sort_order", { ascending: true }),
    supabase.from("expense_categories").select("id, name").eq("project_id", projectId),
  ])

  return NextResponse.json({
    expenses: expenses || [],
    milestones: milestones || [],
    categories: categories || [],
  })
}
