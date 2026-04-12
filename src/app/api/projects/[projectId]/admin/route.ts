import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

const createAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createAdminSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, phone, password } = parsed.data

    // Check if auth user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = userList?.users.find((u) => u.email === email)

    let targetUserId: string

    if (existingAuthUser) {
      targetUserId = existingAuthUser.id
    } else {
      // Create the auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      })
      if (createError || !newUser.user) {
        console.error("[create admin] auth.createUser error:", createError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }
      targetUserId = newUser.user.id
    }

    // Upsert profile with PROJECT_ADMIN role
    await supabaseAdmin.from("profiles").upsert(
      { id: targetUserId, name, role: "PROJECT_ADMIN", phone: phone ?? null },
      { onConflict: "id" }
    )

    // Upsert into project_admins
    const { error: adminError } = await supabaseAdmin
      .from("project_admins")
      .upsert(
        { project_id: projectId, user_id: targetUserId },
        { onConflict: "project_id,user_id" }
      )

    if (adminError) {
      console.error("[create admin] project_admins upsert:", adminError)
      return NextResponse.json({ error: "Failed to assign admin to project" }, { status: 500 })
    }

    await logAction({
      userId: user.id,
      projectId,
      action: "CREATE",
      entityType: "project_admin",
      entityId: targetUserId,
      details: { email, name },
    })

    return NextResponse.json({ success: true, userId: targetUserId, email, name }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/projects/[projectId]/admin]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
