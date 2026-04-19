import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

const createPackageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).min(1, "Select at least one feature"),
})

async function getSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "SUPER_ADMIN") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user, error: null }
}

export async function GET() {
  try {
    const { user, error } = await getSuperAdmin()
    if (error) return error

    const { data: packages, error: dbError } = await supabaseAdmin
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) throw dbError

    return NextResponse.json(packages ?? [])
  } catch (err) {
    console.error("[GET /api/packages]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getSuperAdmin()
    if (error) return error

    const body = await request.json()
    const parsed = createPackageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, description, features } = parsed.data

    const { data: pkg, error: dbError } = await supabaseAdmin
      .from("packages")
      .insert({
        name,
        description: description ?? null,
        features,
        is_active: true,
      })
      .select()
      .single()

    if (dbError || !pkg) throw dbError

    await logAction({
      userId: user!.id,
      action: "CREATE_PACKAGE",
      entityType: "package",
      entityId: pkg.id,
      details: { name },
    })

    return NextResponse.json(pkg, { status: 201 })
  } catch (err) {
    console.error("[POST /api/packages]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
