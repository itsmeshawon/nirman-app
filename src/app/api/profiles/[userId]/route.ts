import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Allow: own profile update OR project admin updating a shareholder
    // Simplified: allow if user.id === userId, OR if user is PROJECT_ADMIN (check profile role)
    const { data: requestingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isOwnProfile = user.id === userId
    const isAdmin = requestingProfile?.role === "PROJECT_ADMIN" || requestingProfile?.role === "SUPER_ADMIN"

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, profession, designation, organization, present_address, whatsapp_no } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (profession !== undefined) updateData.profession = profession
    if (designation !== undefined) updateData.designation = designation
    if (organization !== undefined) updateData.organization = organization
    if (present_address !== undefined) updateData.present_address = present_address
    if (whatsapp_no !== undefined) updateData.whatsapp_no = whatsapp_no

    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update(updateData)
      .eq("id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
