import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"
import { applyPendingPenalties } from "@/lib/penalty"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only Admins can invoke the penalty sweeper manually for MVP
    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Run the engine
    const result = await applyPendingPenalties(projectId, supabase)

    if (result.appliedCount > 0) {
       await logAction({
         projectId,
         userId: user.id,
         action: "APPLY_PENALTIES",
         entityType: "project",
         entityId: projectId,
         details: { count: result.appliedCount, message: result.message }
       })
    }

    return NextResponse.json({ success: true, ...result }, { status: 200 })

  } catch (err: any) {
    console.error("Penalty apply error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
