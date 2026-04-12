import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"

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

    // Only project admins can upload media to the feed for now
    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const path = formData.get("path") as string

    if (!file || !path) {
      return NextResponse.json({ error: "Missing file or path" }, { status: 400 })
    }

    // Basic file validation
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB (matching the highest limit in UI)
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage using admin client to bypass RLS
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("activity-media")
      .upload(path, arrayBuffer, { 
        contentType: file.type,
        upsert: true 
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: data.path }, { status: 200 })

  } catch (err: any) {
    console.error("Feed media upload error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const { path } = await request.json()
    if (!path) return NextResponse.json({ error: "Path required" }, { status: 400 })

    // Only allow deleting files within the project's folder for safety
    if (!path.startsWith(`${projectId}/`)) {
       return NextResponse.json({ error: "Invalid path access." }, { status: 403 })
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from("activity-media")
      .remove([path])

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
