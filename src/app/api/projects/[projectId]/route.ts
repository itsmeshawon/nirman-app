import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only Super Admin or someone explicitly linked could see this, 
    // but for the Super Admin dashboard we'll check the role via Admin bypass
    const { data: profile } = await getSupabaseAdmin()
      .from("profiles").select("role").eq("id", user.id).single()
    
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: project, error } = await getSupabaseAdmin()
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (err) {
    console.error("[GET /api/projects/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params
  const { projectId } = params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Authorization: Only SUPER_ADMIN can delete projects
    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify project exists
    const { data: project } = await getSupabaseAdmin()
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check for active shareholders
    const { count: activeShareholders } = await getSupabaseAdmin()
      .from("shareholders")
      .select("id", { count: "exact" })
      .eq("project_id", projectId)
      .eq("status", "ACTIVE")

    if ((activeShareholders ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete project with ${activeShareholders} active shareholders. Deactivate all shareholders first.`,
          activeShareholders,
        },
        { status: 400 }
      )
    }

    // Check for unpaid payments
    const { count: unpaidPayments } = await getSupabaseAdmin()
      .from("payments")
      .select("id", { count: "exact" })
      .eq("project_id", projectId)
      .neq("status", "PAID")

    if ((unpaidPayments ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete project with ${unpaidPayments} unpaid payments.`,
          unpaidPayments,
        },
        { status: 400 }
      )
    }

    // Cascade delete in correct dependency order
    // ─── Step 0: Audit logs (FK on project_id, must go first) ───────────────
    await getSupabaseAdmin().from("audit_logs").delete().eq("project_id", projectId)

    // ─── Step 1: Notifications (has project_id) ──────────────────────────────
    await getSupabaseAdmin().from("notifications").delete().eq("project_id", projectId)

    // ─── Step 2: Post reactions & views (link via post_id, not project_id) ───
    const { data: projectPosts } = await getSupabaseAdmin()
      .from("activity_posts")
      .select("id")
      .eq("project_id", projectId)
    const postIds = (projectPosts ?? []).map((p) => p.id)
    if (postIds.length > 0) {
      await getSupabaseAdmin().from("reactions").delete().in("post_id", postIds)
      await getSupabaseAdmin().from("post_views").delete().in("post_id", postIds)
    }

    // ─── Step 3: Activity posts ───────────────────────────────────────────────
    await getSupabaseAdmin().from("activity_posts").delete().eq("project_id", projectId)

    // ─── Step 4: Expense attachments & approvals (link via expense_id) ────────
    const { data: projectExpenses } = await getSupabaseAdmin()
      .from("expenses")
      .select("id")
      .eq("project_id", projectId)
    const expenseIds = (projectExpenses ?? []).map((e) => e.id)
    if (expenseIds.length > 0) {
      await getSupabaseAdmin().from("expense_attachments").delete().in("expense_id", expenseIds)
      await getSupabaseAdmin().from("expense_approvals").delete().in("expense_id", expenseIds)
    }

    // ─── Step 5: Expenses ─────────────────────────────────────────────────────
    await getSupabaseAdmin().from("expenses").delete().eq("project_id", projectId)

    // ─── Step 6: Payments ────────────────────────────────────────────────────
    await getSupabaseAdmin().from("payments").delete().eq("project_id", projectId)

    // ─── Step 7: Penalties (link via schedule_item_id → schedule_id) ─────────
    const { data: projectSchedules } = await getSupabaseAdmin()
      .from("payment_schedules")
      .select("id")
      .eq("project_id", projectId)
    const scheduleIds = (projectSchedules ?? []).map((s) => s.id)
    if (scheduleIds.length > 0) {
      const { data: projectScheduleItems } = await getSupabaseAdmin()
        .from("schedule_items")
        .select("id")
        .in("schedule_id", scheduleIds)
      const scheduleItemIds = (projectScheduleItems ?? []).map((si) => si.id)
      if (scheduleItemIds.length > 0) {
        await getSupabaseAdmin().from("penalties").delete().in("schedule_item_id", scheduleItemIds)
      }
      await getSupabaseAdmin().from("schedule_items").delete().in("schedule_id", scheduleIds)
    }

    // ─── Step 8: Payment schedules ───────────────────────────────────────────
    await getSupabaseAdmin().from("payment_schedules").delete().eq("project_id", projectId)

    // ─── Step 9: Milestones ──────────────────────────────────────────────────
    await getSupabaseAdmin().from("milestones").delete().eq("project_id", projectId)

    // ─── Step 10: Penalty configs ─────────────────────────────────────────────
    await getSupabaseAdmin().from("penalty_configs").delete().eq("project_id", projectId)

    // ─── Step 11: Committee members ───────────────────────────────────────────
    await getSupabaseAdmin().from("committee_members").delete().eq("project_id", projectId)

    // ─── Step 12: Shareholders ────────────────────────────────────────────────
    await getSupabaseAdmin().from("shareholders").delete().eq("project_id", projectId)

    // ─── Step 13: Project admins ──────────────────────────────────────────────
    await getSupabaseAdmin().from("project_admins").delete().eq("project_id", projectId)

    // ─── Step 14: Expense categories ──────────────────────────────────────────
    await getSupabaseAdmin().from("expense_categories").delete().eq("project_id", projectId)

    // ─── Step 15: Approval & notification configs ─────────────────────────────
    await getSupabaseAdmin().from("notification_configs").delete().eq("project_id", projectId)
    await getSupabaseAdmin().from("approval_configs").delete().eq("project_id", projectId)

    // ─── Step 16: Project documents ───────────────────────────────────────────
    await getSupabaseAdmin().from("project_documents").delete().eq("project_id", projectId)

    // ─── Step 17: Delete the project itself ───────────────────────────────────
    const { error: deleteError } = await getSupabaseAdmin()
      .from("projects")
      .delete()
      .eq("id", projectId)

    if (deleteError) {
      console.error("Project delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    // Audit log
    await logAction({
      userId: user.id,
      action: "DELETE_PROJECT",
      entityType: "project",
      entityId: projectId,
      details: { name: project.name },
    }).catch((err) => {
      console.error("Audit logging failed:", err)
    })

    return NextResponse.json(
      { success: true, message: "Project deleted successfully" },
      { status: 200 }
    )
  } catch (err: any) {
    console.error("DELETE /api/projects/[projectId]:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
