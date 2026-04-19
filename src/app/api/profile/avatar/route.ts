import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 2MB" }, { status: 400 })
    }

    // Get old profile to check for existing avatar
    const { data: oldProfile } = await getSupabaseAdmin()
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    // Determine file extension
    const fileExt = file.name.split(".").pop() || "png"
    const fileName = `avatar-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = getSupabaseAdmin().storage
      .from("avatars")
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update Profile
    const { error: dbError } = await getSupabaseAdmin()
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)

    if (dbError) {
      // Cleanup storage if database update fails
      await getSupabaseAdmin().storage.from("avatars").remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Optional: Cleanup old avatar file from storage if it was internal
    if (oldProfile?.avatar_url && oldProfile.avatar_url.includes("/avatars/")) {
        try {
            const oldPathMatch = oldProfile.avatar_url.split("/avatars/")[1]
            if (oldPathMatch) {
                const oldPath = oldPathMatch.split("?")[0] // Remove query params if any
                await getSupabaseAdmin().storage.from("avatars").remove([oldPath])
            }
        } catch (cleanupErr) {
            console.warn("Cleanup of old avatar failed:", cleanupErr)
        }
    }

    await logAction({
      userId: user.id,
      action: "UPDATE_AVATAR",
      entityType: "profile",
      entityId: user.id,
      details: { fileName }
    })

    return NextResponse.json({ success: true, avatarUrl }, { status: 200 })

  } catch (err: any) {
    console.error("Avatar Upload API Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
