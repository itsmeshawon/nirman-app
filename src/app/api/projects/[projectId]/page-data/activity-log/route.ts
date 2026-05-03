import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
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

  const { data: logs } = await getSupabaseAdmin()
    .from("audit_logs")
    .select("id, action, entity_type, details, created_at, user_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(500)

  return NextResponse.json({ logs: logs ?? [] })
}
