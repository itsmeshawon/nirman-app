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

  const [{ data: shareholders }, { data: committeeMembers }] = await Promise.all([
    supabase.from("shareholders").select("*, profiles(*)").eq("project_id", projectId).order("unit_flat", { ascending: true }),
    supabase.from("committee_members").select("shareholder_id").eq("project_id", projectId).eq("is_active", true),
  ])

  return NextResponse.json({
    shareholders: shareholders || [],
    committeeShareholderIds: (committeeMembers ?? []).map((cm: any) => cm.shareholder_id).filter(Boolean),
  })
}
