import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"
import { createNotificationsForMany } from "@/lib/notifications"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params;
  const { projectId, id } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden: Only admins can publish." }, { status: 403 }) }

    // Ensure it is APPROVED
    const { data: existing } = await supabase
      .from("expenses")
      .select("status, title")
      .eq("id", id)
      .single()

    if (!existing || existing.status !== "APPROVED") {
        return NextResponse.json({ error: "Only APPROVED expenses can be published" }, { status: 400 })
    }

    const { error } = await supabase
      .from("expenses")
      .update({
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("project_id", projectId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "PUBLISH_EXPENSE",
      entityType: "expense",
      entityId: id,
      details: { title: existing.title, status: "PUBLISHED" }
    })

    // Notify all shareholders
    try {
      const { data: shareholders } = await supabaseAdmin
        .from("shareholders")
        .select("user_id")
        .eq("project_id", projectId)

      const userIds = (shareholders || []).map((s: any) => s.user_id).filter(Boolean)

      await createNotificationsForMany(userIds, {
        projectId,
        type: "EXPENSE_PUBLISHED",
        title: "Project expense published",
        body: existing.title,
        linkUrl: "/my/expenses",
      })
    } catch (notifErr) {
      console.error("[notifications] Failed to notify shareholders:", notifErr)
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
