import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Authenticate & Check Super Admin role
    const { data: { user: superAdmin } } = await supabase.auth.getUser()
    if (!superAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check role safely
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", superAdmin.id)
      .single()

    if (!currentProfile || currentProfile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Fetch all PROJECT_ADMIN profiles (Robust Fetch)
    const { data: profiles, error: pError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, phone, status, created_at")
      .eq("role", "PROJECT_ADMIN")
      .order("created_at", { ascending: false })

    if (pError) throw pError

    // 3. Fetch all project_admin mappings (Robust Fetch)
    const { data: mappings, error: mError } = await supabaseAdmin
      .from("project_admins")
      .select("user_id, project_id")

    if (mError) {
      console.warn("Mappings fetch failed:", mError)
    }

    // 4. Manual Merge
    const formatted = (profiles ?? []).map(profile => {
      const userMappings = (mappings ?? []).filter(m => m.user_id === profile.id)
      
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        status: (profile as any).status || "ACTIVE",
        createdAt: profile.created_at,
        assignedProjectIds: userMappings.map(m => m.project_id),
        assignedProjects: [] // Currently not showing project names here for stability
      }
    })

    return NextResponse.json(formatted)
  } catch (err: any) {
    console.error("[GET /api/super-admin/admins]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
