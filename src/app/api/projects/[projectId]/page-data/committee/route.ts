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

  const [{ data: config }, { data: members }, { data: allActiveShareholders }] = await Promise.all([
    supabase.from("approval_configs").select("rule").eq("project_id", projectId).single(),
    getSupabaseAdmin().from("committee_members").select("id, created_at, shareholders(unit_flat, profiles(name, email))").eq("project_id", projectId).eq("is_active", true),
    getSupabaseAdmin().from("shareholders").select("id, user_id, unit_flat, profiles(name, email)").eq("project_id", projectId).eq("status", "ACTIVE"),
  ])

  const membersArr = members || []
  const availableShareholders = (allActiveShareholders || []).filter(
    (sh: any) => !membersArr.some((m: any) => m.shareholders?.unit_flat === sh.unit_flat)
  )

  return NextResponse.json({
    currentRule: config?.rule || "MAJORITY",
    members: membersArr,
    availableShareholders,
  })
}
