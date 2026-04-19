import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Fetch project with package info
    const { data: projectRaw } = await supabaseAdmin
      .from("projects")
      .select("*, packages(id, name, features, is_active)")
      .eq("id", projectId)
      .single()

    const project = projectRaw ? {
      ...projectRaw,
      package: projectRaw.packages ?? null,
      packages: undefined,
    } : null

    // Fetch project admins with profiles
    const { data: projectAdmins } = await supabaseAdmin
      .from("project_admins")
      .select("user_id")
      .eq("project_id", projectId)

    const adminUserIds = projectAdmins?.map((a: { user_id: string }) => a.user_id) || []
    const { data: adminProfiles } = adminUserIds.length
      ? await getSupabaseAdmin().from("profiles").select("id, name, email, phone, profession, designation, organization, present_address, whatsapp_no, is_active").in("id", adminUserIds)
      : { data: [] }

    // Fetch shareholders with profiles
    const { data: shareholders } = await supabaseAdmin
      .from("shareholders")
      .select("id, user_id, unit_flat, ownership_pct, opening_balance, status")
      .eq("project_id", projectId)
      .order("unit_flat", { ascending: true })

    const shareholderUserIds = shareholders?.map((s: { user_id: string }) => s.user_id).filter(Boolean) || []
    const { data: shareholderProfiles } = shareholderUserIds.length
      ? await getSupabaseAdmin().from("profiles").select("id, name, email, phone, profession, designation, organization, present_address, whatsapp_no, is_active").in("id", shareholderUserIds)
      : { data: [] }

    // Merge shareholder profiles
    const shareholdersWithProfiles = (shareholders || []).map((sh: any) => ({
      ...sh,
      profile: shareholderProfiles?.find((p: any) => p.id === sh.user_id) || null
    }))

    // Fetch committee members
    const { data: committeeMembers } = await supabaseAdmin
      .from("committee_members")
      .select("id, shareholder_id, user_id, is_active")
      .eq("project_id", projectId)
      .eq("is_active", true)

    const committeeWithProfiles = (committeeMembers || []).map((cm: any) => {
      const sh = shareholdersWithProfiles.find((s: any) => s.id === cm.shareholder_id)
      return { ...cm, shareholder: sh || null }
    })

    return NextResponse.json({
      project,
      admins: adminProfiles || [],
      shareholders: shareholdersWithProfiles,
      committeeMembers: committeeWithProfiles,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
