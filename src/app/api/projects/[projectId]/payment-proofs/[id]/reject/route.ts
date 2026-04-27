import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const { projectId, id } = await props.params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const { data: proof } = await getSupabaseAdmin()
      .from("payment_proofs")
      .select("*")
      .eq("id", id)
      .eq("project_id", projectId)
      .single()

    if (!proof) return NextResponse.json({ error: "Proof not found" }, { status: 404 })
    if (proof.status !== "PENDING") return NextResponse.json({ error: "Proof is not pending" }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const rejectionNote = body.rejection_note || null

    const { data: updatedProof, error } = await getSupabaseAdmin()
      .from("payment_proofs")
      .update({
        status: "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_note: rejectionNote,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      userId: user.id,
      projectId,
      action: "REJECT_PAYMENT_PROOF",
      entityType: "payment_proof",
      entityId: id,
      details: { amount: proof.amount },
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true, proof: updatedProof }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
