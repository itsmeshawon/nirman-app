import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SuperAdminShell from "@/components/layouts/SuperAdminShell"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "SUPER_ADMIN") redirect("/login")

  return (
    <SuperAdminShell userName={profile.name ?? user.email ?? "Admin"}>
      {children}
    </SuperAdminShell>
  )
}
