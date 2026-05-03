import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await requireProjectAdmin(supabase, projectId)
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [{ data: project }, { data: profile }] = await Promise.all([
    getSupabaseAdmin().from("projects").select("name, status").eq("id", projectId).single(),
    supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single(),
  ])

  return NextResponse.json({ project, profile })
}
