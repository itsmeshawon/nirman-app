import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const VALID_REACTION_TYPES = ["LIKE", "LOVE", "MEH", "SAD"] as const
type ReactionType = typeof VALID_REACTION_TYPES[number]

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string; id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { reaction_type } = body

    if (!VALID_REACTION_TYPES.includes(reaction_type as ReactionType)) {
      return NextResponse.json({ error: "Invalid reaction_type. Must be LIKE, LOVE, MEH, or SAD." }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // DB column is "type", not "reaction_type"
    const { data: existing } = await admin
      .from("reactions")
      .select("id, type")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single()

    if (existing) {
      if (existing.type === reaction_type) {
        const { error } = await admin.from("reactions").delete().eq("id", existing.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ action: "removed" }, { status: 200 })
      } else {
        const { error } = await admin.from("reactions").update({ type: reaction_type }).eq("id", existing.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ action: "updated" }, { status: 200 })
      }
    }

    const { error } = await admin
      .from("reactions")
      .insert({ post_id: id, user_id: user.id, type: reaction_type })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ action: "added" }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
