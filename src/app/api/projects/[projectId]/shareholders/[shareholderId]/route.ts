import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string, shareholderId: string }> }
) {
  const params = await props.params;
  const { projectId, shareholderId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await requireProjectAdmin(supabase, projectId)
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    // Don't allow changing project_id, user_id from this endpoint
    const { unit_flat, ownership_pct, opening_balance, status } = body
    const { profession, designation, organization, present_address, whatsapp_no } = body

    // 2. Update the shareholder record
    const { data: shData, error: updateError } = await supabase
      .from("shareholders")
      .update({
        unit_flat,
        ownership_pct: ownership_pct !== undefined ? parseFloat(ownership_pct) : undefined,
        opening_balance: opening_balance !== undefined ? parseFloat(opening_balance) : undefined,
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", shareholderId)
      .eq("project_id", projectId) // ensure it belongs to this project
      .select("user_id")
      .single()

    if (updateError) {
      console.error("Shareholder update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 2b. Update associated profile fields if any were provided
    const profileUpdate: Record<string, any> = {}
    if (profession !== undefined) profileUpdate.profession = profession
    if (designation !== undefined) profileUpdate.designation = designation
    if (organization !== undefined) profileUpdate.organization = organization
    if (present_address !== undefined) profileUpdate.present_address = present_address
    if (whatsapp_no !== undefined) profileUpdate.whatsapp_no = whatsapp_no

    if (shData?.user_id && Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", shData.user_id)

      if (profileError) {
        console.error("Profile update error:", profileError)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "UPDATE_SHAREHOLDER",
      entityType: "shareholder",
      entityId: shareholderId,
      details: { unit_flat, status }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Shareholder PATCH err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ projectId: string, shareholderId: string }> }
) {
  const params = await props.params;
  const { projectId, shareholderId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await requireProjectAdmin(supabase, projectId)
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Delete the shareholder record
    const { error: deleteError } = await supabase
      .from("shareholders")
      .delete()
      .eq("id", shareholderId)
      .eq("project_id", projectId)

    if (deleteError) {
      console.error("Shareholder delete error:", deleteError)
      // Check for foreign key constraints
      if (deleteError.code === "23503") {
        return NextResponse.json({ 
          error: "Cannot delete shareholder because they have linked records (payments or schedules). Deactivate them instead." 
        }, { status: 400 })
      }
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // 3. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "DELETE_SHAREHOLDER",
      entityType: "shareholder",
      entityId: shareholderId,
      details: { deleted_at: new Date().toISOString() }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Shareholder DELETE err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
