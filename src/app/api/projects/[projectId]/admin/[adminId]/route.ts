import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; adminId: string }> }
) {
  try {
    const { projectId, adminId } = await params
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Authorization - Only super admins can delete project admins
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 3. Verify admin exists and is assigned to this project
    const { data: projectAdmin } = await supabaseAdmin
      .from("project_admins")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", adminId)
      .single()

    if (!projectAdmin) {
      return NextResponse.json(
        { error: "Project admin not found" },
        { status: 404 }
      )
    }

    // 4. Get admin profile info for audit logging
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("name, email")
      .eq("id", adminId)
      .single()

    // 5. Delete the project admin assignment
    const { error: deleteError } = await supabaseAdmin
      .from("project_admins")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", adminId)

    if (deleteError) {
      console.error("Delete project admin error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete project admin" },
        { status: 500 }
      )
    }

    // 6. Audit logging
    await logAction({
      projectId,
      userId: user.id,
      action: "DELETE_PROJECT_ADMIN",
      entityType: "project_admin",
      entityId: adminId,
      details: {
        name: adminProfile?.name,
        email: adminProfile?.email,
      },
    }).catch((err) => {
      console.error("Audit logging failed:", err)
      // Non-blocking - continue even if logging fails
    })

    return NextResponse.json(
      { success: true, message: "Project admin removed successfully" },
      { status: 200 }
    )
  } catch (err: any) {
    console.error("DELETE /api/projects/[projectId]/admin/[adminId]:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
