import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

const updatePackageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).min(1, "Select at least one feature"),
})

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updatePackageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, description, features } = parsed.data

    const { data: pkg, error: dbError } = await supabaseAdmin
      .from("packages")
      .update({
        name,
        description: description ?? null,
        features,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (dbError || !pkg) throw dbError

    await logAction({
      userId: user.id,
      action: "UPDATE_PACKAGE",
      entityType: "package",
      entityId: id,
      details: { name },
    })

    return NextResponse.json(pkg)
  } catch (err) {
    console.error("[PUT /api/packages/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
