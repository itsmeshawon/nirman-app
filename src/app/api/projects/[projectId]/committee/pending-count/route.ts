import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params

  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Authorization - Check if user is an active committee member for this project
    const { data: committeeMember, error: memberError } = await getSupabaseAdmin()
      .from("committee_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!committeeMember) {
      return NextResponse.json({ error: "Not a committee member" }, { status: 403 })
    }

    // 3. Count pending reviews (SUBMITTED or CHANGES_REQUESTED)
    const { count, error: countError } = await getSupabaseAdmin()
      .from("expenses")
      .select("id", { count: "exact" })
      .eq("project_id", projectId)
      .in("status", ["SUBMITTED", "CHANGES_REQUESTED"])

    if (countError) {
      console.error("Count pending expenses error:", countError)
      return NextResponse.json({ error: "Failed to count pending reviews" }, { status: 500 })
    }

    const pendingCount = count ?? 0
    // Format: show as-is up to 99, then "99+" for 100+
    const displayCount = pendingCount > 99 ? "99+" : pendingCount

    return NextResponse.json({ count: pendingCount, displayCount }, { status: 200 })
  } catch (err: any) {
    console.error("[GET /api/projects/[projectId]/committee/pending-count]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
