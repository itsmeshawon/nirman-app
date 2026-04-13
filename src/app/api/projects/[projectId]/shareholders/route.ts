import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"
import crypto from "crypto"

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await requireProjectAdmin(supabase, projectId)
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, unit_flat, ownership_pct, opening_balance } = body
    const { profession, designation, organization, present_address, whatsapp_no } = body

    if (!name || !email || !unit_flat) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 2. Check if user already exists
    let newUserId: string
    let tempPassword = ""

    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error("List users error:", listError)
      return NextResponse.json({ error: "Failed to query users" }, { status: 500 })
    }

    const existingUser = listData.users.find(u => u.email === email)

    if (existingUser) {
      newUserId = existingUser.id
    } else {
      // 3. Create new user
      tempPassword = crypto.randomBytes(4).toString('hex') // 8 chars temporary password
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name, role: 'SHAREHOLDER' }
      })

      if (createError) {
        console.error("Create user error:", createError)
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }

      newUserId = userData.user.id

      // Upsert profile for the newly created user using Admin Client to bypass RLS initially
      await supabaseAdmin.from('profiles').upsert({
         id: newUserId,
         name,
         email,
         phone: phone || null,
         role: 'SHAREHOLDER',
         profession: profession || null,
         designation: designation || null,
         organization: organization || null,
         present_address: present_address || null,
         whatsapp_no: whatsapp_no || null,
      })
    }

    // 4. Create the shareholder record
    const { data: shData, error: shError } = await supabaseAdmin
      .from("shareholders")
      .insert({
        project_id: projectId,
        user_id: newUserId,
        unit_flat,
        ownership_pct: ownership_pct ? parseFloat(ownership_pct) : null,
        opening_balance: opening_balance ? parseFloat(opening_balance) : 0,
        status: "ACTIVE"
      })
      .select("id")
      .single()

    if (shError) {
      // If shareholder creation fails, might need to cleanup user if newly created, 
      // but for simplicity currently just returning error.
      console.error("Shareholder insert error:", shError)
      return NextResponse.json({ error: shError.message }, { status: 400 })
    }

    // 5. Audit Log
    await logAction({
      projectId,
      userId: user.id,
      action: "CREATE_SHAREHOLDER",
      entityType: "shareholder",
      entityId: shData.id,
      details: { email, unit_flat }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: existingUser ? "Shareholder linked successfully" : "Shareholder created successfully",
        tempPassword: tempPassword || null 
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("Shareholder POST err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
