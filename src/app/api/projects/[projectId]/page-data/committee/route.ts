import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"
import { cacheGet, cacheSet } from "@/lib/cache"

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

  const cacheKey = `committee:${projectId}`
  const cached = cacheGet<unknown>(cacheKey)
  if (cached) return NextResponse.json(cached)

  const [{ data: config }, { data: members }, { data: allActiveShareholders }] = await Promise.all([
    supabase.from("approval_configs").select("rule").eq("project_id", projectId).single(),
    getSupabaseAdmin().from("committee_members").select("id, shareholder_id, created_at, shareholders(unit_flat, profiles(name, email, phone))").eq("project_id", projectId).eq("is_active", true),
    getSupabaseAdmin().from("shareholders").select("id, user_id, unit_flat, profiles(name, email)").eq("project_id", projectId).eq("status", "ACTIVE"),
  ])

  const membersArr = members || []
  const memberShareholderIds = new Set(membersArr.map((m: any) => m.shareholder_id).filter(Boolean))
  const availableShareholders = (allActiveShareholders || []).filter(
    (sh: any) => !memberShareholderIds.has(sh.id)
  )

  const payload = {
    currentRule: config?.rule || "MAJORITY",
    members: membersArr,
    availableShareholders,
  }
  cacheSet(cacheKey, payload)
  return NextResponse.json(payload)
}
