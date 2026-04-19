import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import * as z from "zod"

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  whatsapp_no: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  present_address: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, phone, name, role, avatar_url, is_active, profession, designation, organization, present_address, whatsapp_no, created_at, updated_at")
      .eq("id", user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(profile, { status: 200 })
  } catch (err: any) {
    console.error("GET /api/profile error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = updateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    await logAction({
      userId: user.id,
      action: "UPDATE_PROFILE",
      entityType: "profile",
      entityId: user.id,
      details: data
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error("PUT /api/profile error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
