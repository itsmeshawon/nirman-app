import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin, getUserProfile } from "@/lib/permissions"
import ProjectAdminShell from "@/components/layouts/ProjectAdminShell"

export default async function ProjectAdminLayout(props: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const params = await props.params;

  const {
    projectId
  } = params;

  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  try {
    // 2. Check if user is an admin for this specific project
    await requireProjectAdmin(supabase, projectId)
    
    // 3. Get profile for shell
    const profile = await getUserProfile(supabase)
    
    // 4. Get project details for shell
    const { data: project } = await supabase
      .from("projects")
      .select("name, status")
      .eq("id", projectId)
      .single()

    if (!project) {
      throw new Error("Project not found")
    }

    return (
      <ProjectAdminShell
        projectId={projectId}
        projectName={project.name}
        projectStatus={project.status}
        user={user}
        profileName={profile.name}
      >
        {props.children}
      </ProjectAdminShell>
    )
  } catch (error) {
    console.error("Project Admin Auth Error:", error)
    redirect("/login")
  }
}
