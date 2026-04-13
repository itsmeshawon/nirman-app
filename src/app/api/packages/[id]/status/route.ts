import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { is_active } = body

    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 })
    }

    const { data: pkg, error: dbError } = await supabaseAdmin
      .from("packages")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (dbError || !pkg) throw dbError

    await logAction({
      userId: user.id,
      action: is_active ? "ACTIVATE_PACKAGE" : "DEACTIVATE_PACKAGE",
      entityType: "package",
      entityId: id,
    })

    return NextResponse.json(pkg)
  } catch (err) {
    console.error("[PATCH /api/packages/[id]/status]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
