import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

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
    const { name, email, phone, password, unit_flat, ownership_pct, opening_balance } = body
    const { profession, designation, organization, present_address, whatsapp_no, payment_model } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 2. Check if user already exists
    let newUserId: string
    let tempPassword = ""

    const { data: existingProfile, error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (profileError) {
      console.error("Profile lookup error:", profileError)
      return NextResponse.json({ error: "Failed to query users" }, { status: 500 })
    }

    if (existingProfile) {
      newUserId = existingProfile.id
    } else {
      // 3. Create new user
      tempPassword = password || "test1234"
      const { data: userData, error: createError } = await getSupabaseAdmin().auth.admin.createUser({
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
      await getSupabaseAdmin().from('profiles').upsert({
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
    const { data: shData, error: shError } = await getSupabaseAdmin()
      .from("shareholders")
      .insert({
        project_id: projectId,
        user_id: newUserId,
        unit_flat: unit_flat || null,
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

    // 5. Save payment model if provided
    if (payment_model && (payment_model.monthly_enabled || payment_model.milestone_based_enabled)) {
      await getSupabaseAdmin()
        .from("shareholder_payment_models")
        .upsert({
          shareholder_id: shData.id,
          project_id: projectId,
          monthly_enabled: payment_model.monthly_enabled ?? false,
          monthly_amount: payment_model.monthly_amount ?? null,
          monthly_due_day: payment_model.monthly_due_day ?? null,
          milestone_based_enabled: payment_model.milestone_based_enabled ?? false,
          milestone_amount: payment_model.milestone_amount ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "shareholder_id" })
    }

    // 6. Audit Log
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
        message: existingProfile ? "Shareholder linked successfully" : "Shareholder created successfully",
        tempPassword: tempPassword || null 
      },
      { status: 201 }
    )

  } catch (err: any) {
    console.error("Shareholder POST err:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
