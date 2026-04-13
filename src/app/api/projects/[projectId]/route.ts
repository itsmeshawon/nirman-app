import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only Super Admin or someone explicitly linked could see this, 
    // but for the Super Admin dashboard we'll check the role via Admin bypass
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("role").eq("id", user.id).single()
    
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (err) {
    console.error("[GET /api/projects/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
