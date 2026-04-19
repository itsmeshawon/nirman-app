import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { ShareholderDocsClient } from "./ShareholderDocsClient"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ShareholderDocumentsPage() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  // 2. Find shareholder project
  const { data: shareholder } = await supabase
    .from("shareholders")
    .select("project_id")
    .eq("user_id", user.id)
    .single()

  if (!shareholder) {
    return (
      <div className="p-8 text-center text-on-surface-variant">
        Project not found for your account.
      </div>
    )
  }

  // 3. Fetch project documents
  const { data: documents } = await supabaseAdmin
    .from("project_documents")
    .select("*")
    .eq("project_id", shareholder.project_id)
    .order("uploaded_at", { ascending: false })

  return (
    <div className="w-full">
      <ShareholderDocsClient documents={documents || []} />
    </div>
  )
}

