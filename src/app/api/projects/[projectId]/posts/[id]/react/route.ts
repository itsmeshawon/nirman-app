import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const VALID_REACTION_TYPES = ["LIKE", "LOVE", "APPRECIATE"] as const
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
      return NextResponse.json({ error: "Invalid reaction_type. Must be LIKE, LOVE, or APPRECIATE." }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Check existing reaction
    const { data: existing } = await admin
      .from("reactions")
      .select("id, reaction_type")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single()

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Toggle off — delete
        const { error: deleteError } = await admin
          .from("reactions")
          .delete()
          .eq("id", existing.id)

        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 })
        return NextResponse.json({ action: "removed" }, { status: 200 })
      } else {
        // Different type — update
        const { error: updateError } = await admin
          .from("reactions")
          .update({ reaction_type })
          .eq("id", existing.id)

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
        return NextResponse.json({ action: "updated" }, { status: 200 })
      }
    }

    // No existing reaction — insert
    const { error: insertError } = await admin
      .from("reactions")
      .insert({ post_id: id, user_id: user.id, reaction_type })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    return NextResponse.json({ action: "added" }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
