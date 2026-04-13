import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PUT(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check if Super Admin or Project Admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    const isSuperAdmin = profile?.role === "SUPER_ADMIN"
    
    let isProjectAdmin = false
    try { 
      await requireProjectAdmin(supabase, projectId)
      isProjectAdmin = true
    } catch { 
      isProjectAdmin = false
    }

    if (!isSuperAdmin && !isProjectAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, area, start_date, expected_handover, status, package_id, floors, units, salesperson_name, building_meta: rawMeta } = body

    // Reconstruct building_meta — support both flat fields (from dialog) and pre-built object
    const building_meta: Record<string, any> = rawMeta ? { ...rawMeta } : {}
    if (floors != null) building_meta.floors = typeof floors === "string" ? parseInt(floors) || null : floors
    if (units != null) building_meta.units = typeof units === "string" ? parseInt(units) || null : units
    if (salesperson_name !== undefined) building_meta.salesperson_name = salesperson_name || null

    // 2. Update Project
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        name,
        address,
        area,
        start_date: start_date || null,
        expected_handover: expected_handover || null,
        status: status || undefined,
        package_id: package_id || null,
        building_meta: building_meta || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_PROJECT_PROFILE",
      entityType: "project"
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
