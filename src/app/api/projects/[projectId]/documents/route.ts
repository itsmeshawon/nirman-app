import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"
import { logAction } from "@/lib/audit"
import { documentSchema } from "@/lib/validations"

export async function GET(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params
  const { projectId } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")))
    const from = page * limit

    const { data: documents, error, count } = await supabase
      .from("project_documents")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false })
      .range(from, from + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      documents,
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > from + limit,
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params
  const { projectId } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only project admins can upload documents
    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const category = formData.get("category") as string

    if (!file || !name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validation
    const validated = documentSchema.safeParse({
      name,
      category,
      file_path: "temp", // placeholder
      file_type: file.type,
    })

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0]?.message }, { status: 400 })
    }

    // Storage path: {projectId}/docs/{category}/{filename}
    const fileExt = file.name.split('.').pop()
    const safeName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${projectId}/docs/${category.replace(/\s+/g, '_')}/${safeName}`

    // Upload to Storage using Admin Client to bypass RLS for now (hardened later in README instructions)
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from("project-documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    // Insert metadata
    const { data: document, error: dbError } = await getSupabaseAdmin()
      .from("project_documents")
      .insert({
        project_id: projectId,
        name,
        category,
        file_path: filePath,
        file_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      // Rollback storage
      await getSupabaseAdmin().storage.from("project-documents").remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    await logAction({
      projectId,
      userId: user.id,
      action: "UPLOAD_DOCUMENT",
      entityType: "document",
      entityId: document.id,
      details: { name, category }
    })

    return NextResponse.json({ success: true, document }, { status: 201 })

  } catch (err: any) {
    console.error("Document Upload Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
