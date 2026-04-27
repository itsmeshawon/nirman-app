import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

// GET — project admin fetches all proofs for the project
export async function GET(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const { data, error } = await getSupabaseAdmin()
      .from("payment_proofs")
      .select(`
        *,
        shareholder:shareholders(id, unit_flat, profiles(name, email)),
        schedule_item:schedule_items(id, amount, due_date, milestone:milestones(name)),
        reviewer:profiles!reviewed_by(name)
      `)
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — shareholder submits a payment proof (multipart/form-data)
export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await props.params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Must be a shareholder of this project
    const { data: shareholder } = await getSupabaseAdmin()
      .from("shareholders")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single()

    if (!shareholder) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get("file") as File
    const amount = parseFloat(formData.get("amount") as string)
    const scheduleItemId = formData.get("schedule_item_id") as string | null
    const notes = formData.get("notes") as string | null

    if (!file) return NextResponse.json({ error: "Attachment is required" }, { status: 400 })
    if (!amount || amount <= 0) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 })

    const proofId = crypto.randomUUID()
    const fileExt = file.name.split(".").pop()
    const safeFileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `payment-proofs/${projectId}/${proofId}/${safeFileName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from("expense-proofs")
      .upload(filePath, arrayBuffer, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })

    const { data: urlData } = getSupabaseAdmin()
      .storage.from("expense-proofs")
      .getPublicUrl(filePath)

    const { data: proof, error: dbError } = await getSupabaseAdmin()
      .from("payment_proofs")
      .insert({
        id: proofId,
        project_id: projectId,
        shareholder_id: shareholder.id,
        schedule_item_id: scheduleItemId || null,
        amount,
        attachment_url: urlData.publicUrl,
        attachment_name: file.name,
        notes: notes || null,
        status: "PENDING",
      })
      .select()
      .single()

    if (dbError) {
      await getSupabaseAdmin().storage.from("expense-proofs").remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    await logAction({
      userId: user.id,
      projectId,
      action: "SUBMIT_PAYMENT_PROOF",
      entityType: "payment_proof",
      entityId: proof.id,
      details: { amount, schedule_item_id: scheduleItemId },
    }).catch(err => console.error("Audit failed:", err))

    return NextResponse.json({ success: true, data: proof }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
