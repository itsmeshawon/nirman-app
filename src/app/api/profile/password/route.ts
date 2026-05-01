import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import * as z from "zod"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = passwordSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { currentPassword, newPassword } = validationResult.data

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError || !signInData.user) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    await logAction({
      userId: user.id,
      action: "CHANGE_PASSWORD",
      entityType: "profile",
      entityId: user.id,
      details: {},
    }).catch((err) => console.error("Audit failed:", err))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error("POST /api/profile/password error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
