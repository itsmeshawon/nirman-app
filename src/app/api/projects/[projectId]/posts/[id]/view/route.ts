import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(
  _request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Extract session_id from the Supabase JWT — unique per login session
    const { data: { session } } = await supabase.auth.getSession()
    let sessionId: string | null = null
    if (session?.access_token) {
      try {
        const payload = JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64").toString())
        sessionId = payload.session_id ?? null
      } catch {}
    }

    if (!sessionId) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Check if this session already viewed this post
    const { data: existing } = await admin
      .from("post_views")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, isNew: false }, { status: 200 })
    }

    const { error } = await admin
      .from("post_views")
      .insert({ post_id: id, user_id: user.id, session_id: sessionId })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, isNew: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
