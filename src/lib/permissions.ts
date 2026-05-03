import type { SupabaseClient } from "@supabase/supabase-js"

export async function getUserProfile(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile) throw new Error("Profile not found")
  return profile
}

export async function requireRole(supabase: SupabaseClient, allowedRoles: string[]) {
  const profile = await getUserProfile(supabase)
  if (!allowedRoles.includes(profile.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`)
  }
  return profile
}

export async function requireProjectAdmin(supabase: SupabaseClient, projectId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("project_admins")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single()

  if (error || !data) throw new Error("Not a project admin")
  return data
}

export async function requireProjectMember(supabase: SupabaseClient, projectId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const [{ data: shareholder }, { data: admin }] = await Promise.all([
    supabase.from("shareholders").select("*").eq("project_id", projectId).eq("user_id", user.id).single(),
    supabase.from("project_admins").select("*").eq("project_id", projectId).eq("user_id", user.id).single(),
  ])

  if (!shareholder && !admin) throw new Error("Not a project member")
  return shareholder ?? admin
}

export async function requireCommitteeMember(supabase: SupabaseClient, projectId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("committee_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single()

  if (error || !data) throw new Error("Not a committee member")
  return data
}

export async function getProjectRole(supabase: SupabaseClient, projectId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: admin },
    { data: committee },
    { data: shareholder },
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("project_admins").select("id").eq("project_id", projectId).eq("user_id", user.id).single(),
    supabase.from("committee_members").select("id").eq("project_id", projectId).eq("user_id", user.id).single(),
    supabase.from("shareholders").select("id").eq("project_id", projectId).eq("user_id", user.id).single(),
  ])

  if (profile?.role === "SUPER_ADMIN") return "SUPER_ADMIN"
  if (admin) return "PROJECT_ADMIN"
  if (committee) return "COMMITTEE"
  if (shareholder) return "SHAREHOLDER"
  return null
}
