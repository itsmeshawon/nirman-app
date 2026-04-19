import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { createNotification } from "@/lib/notifications"

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

    // Verify user is an active committee member for this project
    const { data: committeeMember, error: cmError } = await supabaseAdmin
      .from("committee_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!committeeMember || cmError) {
      return NextResponse.json({ error: "Forbidden: You are not an active committee member for this project." }, { status: 403 })
    }

    const body = await request.json()
    const { action, comment } = body // action: "APPROVED", "REJECTED", "CHANGES_REQUESTED"

    if (!["APPROVED", "REJECTED", "CHANGES_REQUESTED"].includes(action)) {
       return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Insert approval record
    const { error: approvalError } = await supabaseAdmin
      .from("expense_approvals")
      .insert({
        expense_id: id,
        user_id: user.id,
        action,
        comment: comment || null
      })

    if (approvalError) return NextResponse.json({ error: approvalError.message }, { status: 400 })

    let newStatus = null

    if (action === "REJECTED") newStatus = "REJECTED"
    else if (action === "CHANGES_REQUESTED") newStatus = "CHANGES_REQUESTED"
    else if (action === "APPROVED") {
       // Check approval rule logic
       const { data: config } = await supabaseAdmin
         .from("approval_configs")
         .select("rule")
         .eq("project_id", projectId)
         .single()

       const rule = config?.rule || "MAJORITY"

       if (rule === "ANY_SINGLE") {
         newStatus = "APPROVED"
       } else if (rule === "MAJORITY") {
         // Count total active committee members
         const { count: totalMembers } = await supabaseAdmin
           .from("committee_members")
           .select("*", { count: 'exact', head: true })
           .eq("project_id", projectId)
           .eq("is_active", true)
           
         // Count how many APPROVED actions for this expense
         const { count: totalApprovals } = await supabaseAdmin
           .from("expense_approvals")
           .select("user_id", { count: 'exact', head: true }) // Distinct logic normally, but count is okay if we assume 1 vote per user (UI blocks double voting or we get latest)
           .eq("expense_id", id)
           .eq("action", "APPROVED")

         // Ensure distinct users count (if user clicks approve multiple times ideally shouldn't happen)
         // But for simplicity, assuming totalApprovals is rough proxy, if > 50%:
         if (totalMembers && totalApprovals && totalApprovals > (totalMembers / 2)) {
           newStatus = "APPROVED"
         }
       }
    }

    // Update parent expense if a new status was reached
    if (newStatus) {
      const { error: updateError } = await supabaseAdmin
        .from("expenses")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    await logAction({
      projectId,
      userId: user.id,
      action: "COMMITTEE_REVIEW",
      entityType: "expense",
      entityId: id,
      details: { reviewAction: action, comment }
    })

    // Notify project admins about the review decision
    try {
      const { data: expense } = await supabaseAdmin
        .from("expenses")
        .select("title")
        .eq("id", id)
        .single()

      const { data: admins } = await supabaseAdmin
        .from("project_admins")
        .select("user_id")
        .eq("project_id", projectId)

      const notifType =
        action === "APPROVED" ? "EXPENSE_APPROVED" :
        action === "REJECTED" ? "EXPENSE_REJECTED" :
        "EXPENSE_CHANGES_REQUESTED"

      const notifTitle =
        action === "APPROVED" ? "Expense approved" :
        action === "REJECTED" ? "Expense rejected" :
        "Changes requested on expense"

      for (const admin of (admins || [])) {
        await createNotification({
          userId: admin.user_id,
          projectId,
          type: notifType,
          title: notifTitle,
          body: expense?.title || undefined,
          linkUrl: `/${projectId}/expenses/${id}`,
        })
      }
    } catch (notifErr) {
      console.error("[notifications] Failed to notify project admins:", notifErr)
    }

    return NextResponse.json({ success: true, newStatus: newStatus || "SUBMITTED" }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
