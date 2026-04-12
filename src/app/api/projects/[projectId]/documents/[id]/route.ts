import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"
import { logAction } from "@/lib/audit"

export async function DELETE(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { projectId, id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only project admins can delete documents
    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Get document metadata to find file path
    const { data: document, error: fetchError } = await supabase
      .from("project_documents")
      .select("file_path, name")
      .eq("id", id)
      .eq("project_id", projectId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("project-documents")
      .remove([document.file_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
      // We continue with DB deletion even if storage fails, 
      // as the record is the source of truth for the UI
    }

    // Delete from Database
    const { error: dbError } = await supabaseAdmin
      .from("project_documents")
      .delete()
      .eq("id", id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "DELETE_DOCUMENT",
      entityType: "document",
      entityId: id,
      details: { name: document.name }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("Document Delete Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
