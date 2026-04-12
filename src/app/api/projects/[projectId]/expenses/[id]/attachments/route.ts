import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

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

    // Check permissions
    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Use Admin Client to bypass RLS for Storage and DB inserts (since we already authorized above)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // File validation
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const safeFileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${projectId}/${id}/${safeFileName}`

    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage bypassing RLS
    const { error: uploadError } = await supabaseAdmin.storage
      .from("expense-proofs")
      .upload(filePath, arrayBuffer, { contentType: file.type })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    // Insert into expense_attachments table bypassing RLS
    const { data: attachment, error: dbError } = await supabaseAdmin
      .from("expense_attachments")
      .insert({
        expense_id: id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type
      })
      .select()
      .single()

    if (dbError) {
      console.error("DB Error writing attachment:", dbError)
      // rollback
      await supabaseAdmin.storage.from("expense-proofs").remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    await logAction({
      projectId,
      userId: user.id,
      action: "UPLOAD_EXPENSE_ATTACHMENT",
      entityType: "expense",
      entityId: id,
      details: { file_name: file.name }
    })

    return NextResponse.json({ success: true, attachment }, { status: 200 })

  } catch (err: any) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
