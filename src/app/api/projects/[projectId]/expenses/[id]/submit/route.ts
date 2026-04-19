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
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Check current status
    const { data: expense } = await supabase
      .from("expenses")
      .select("status, title")
      .eq("id", id)
      .single()

    if (!expense || (expense.status !== "DRAFT" && expense.status !== "CHANGES_REQUESTED")) {
      return NextResponse.json({ error: "Only Draft or Changes Requested expenses can be submitted." }, { status: 400 })
    }

    // Check for attachments (PRD: BLOCKED if no attachment)
    const { count, error: attachmentError } = await supabase
      .from("expense_attachments")
      .select("*", { count: 'exact', head: true })
      .eq("expense_id", id)

    if (attachmentError) return NextResponse.json({ error: attachmentError.message }, { status: 500 })

    if (!count || count === 0) {
      return NextResponse.json({ error: "Cannot submit without uploading at least one proof of attachment." }, { status: 400 })
    }

    // Update to SUBMITTED
    const { error: updateError } = await supabase
      .from("expenses")
      .update({ status: "SUBMITTED", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "SUBMIT_EXPENSE",
      entityType: "expense",
      entityId: id,
      details: { title: expense.title, attachmentsCount: count }
    })

    // Notify active committee members
    try {
      const { data: committeeMembers } = await getSupabaseAdmin()
        .from("committee_members")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("is_active", true)

      const userIds = (committeeMembers || []).map((m: any) => m.user_id).filter(Boolean)

      await createNotificationsForMany(userIds, {
        projectId,
        type: "EXPENSE_SUBMITTED",
        title: "Expense submitted for review",
        body: expense.title,
        linkUrl: "/review",
      })
    } catch (notifErr) {
      console.error("[notifications] Failed to notify committee members:", notifErr)
    }

    return NextResponse.json({ success: true, status: "SUBMITTED" }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
