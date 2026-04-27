import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

// POST — project admin approves a payment proof → creates a payment record
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

    // Fetch the proof
    const { data: proof, error: proofError } = await getSupabaseAdmin()
      .from("payment_proofs")
      .select("*")
      .eq("id", id)
      .eq("project_id", projectId)
      .single()

    if (proofError || !proof) return NextResponse.json({ error: "Proof not found" }, { status: 404 })
    if (proof.status !== "PENDING") return NextResponse.json({ error: "Proof is not pending" }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const method = body.method || "BANK_TRANSFER"
    const referenceNo = body.reference_no || null
    const notes = body.notes || null

    // Generate receipt number matching the standard format
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const { count } = await getSupabaseAdmin()
      .from("payments")
      .select("*", { count: "exact", head: true })
      .like("receipt_no", `NRM-${projectId.slice(0, 4).toUpperCase()}-${todayStr}-%`)
    const seq = String((count || 0) + 1).padStart(3, "0")
    const receipt_no = `NRM-${projectId.slice(0, 4).toUpperCase()}-${todayStr}-${seq}`

    // Create the payment record
    const { data: payment, error: paymentError } = await getSupabaseAdmin()
      .from("payments")
      .insert({
        shareholder_id: proof.shareholder_id,
        receipt_no,
        schedule_item_id: proof.schedule_item_id || null,
        amount: proof.amount,
        method,
        reference_no: referenceNo,
        notes: notes || `Approved from payment proof submission`,
        recorded_by_id: user.id,
      })
      .select()
      .single()

    if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 400 })

    // Mark proof as APPROVED and link the payment
    const { data: updatedProof, error: updateError } = await getSupabaseAdmin()
      .from("payment_proofs")
      .update({
        status: "APPROVED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        payment_id: payment.id,
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    await logAction({
      userId: user.id,
      projectId,
      action: "APPROVE_PAYMENT_PROOF",
      entityType: "payment_proof",
      entityId: id,
      details: { amount: proof.amount, payment_id: payment.id },
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true, proof: updatedProof, payment }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
