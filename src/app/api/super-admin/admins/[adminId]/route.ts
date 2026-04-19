import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ adminId: string }> }
) {
  const params = await props.params;
  const adminId = params.adminId

  try {
    const supabase = await createClient()

    // 1. Check Auth & Super Admin role
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status, password } = body

    // 2. Handle Status Update
    if (status !== undefined) {
      const { error: updateError } = await getSupabaseAdmin()
        .from("profiles")
        .update({ status })
        .eq("id", adminId)
      
      if (updateError) throw updateError
    }

    // 3. Handle Password Reset
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      const { error: pwdError } = await getSupabaseAdmin().auth.admin.updateUserById(adminId, {
        password: password
      })
      if (pwdError) throw pwdError
    }

    // 4. Audit Log
    await logAction({
      userId: currentUser.id,
      action: "UPDATE_ADMIN",
      entityType: "user",
      entityId: adminId,
      details: { updated_fields: Object.keys(body) }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[PATCH /api/super-admin/admins]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ adminId: string }> }
) {
  const params = await props.params;
  const adminId = params.adminId

  try {
    const supabase = await createClient()

    // 1. Check Auth & Super Admin role
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (currentUser.id === adminId) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Delete User from Auth (this cascade deletes profiles if configured, or we do both)
    // Supabase Auth Admin deletion deletes the user from auth.users
    const { error: authError } = await getSupabaseAdmin().auth.admin.deleteUser(adminId)
    if (authError) throw authError

    // 3. Profiles usually has a trigger or FK to auto-delete, but let's be safe
    await getSupabaseAdmin().from("profiles").delete().eq("id", adminId)

    // 4. Audit Log
    await logAction({
      userId: currentUser.id,
      action: "DELETE_ADMIN",
      entityType: "user",
      entityId: adminId
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[DELETE /api/super-admin/admins]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
