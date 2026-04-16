import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
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
    const { data: project } = await supabaseAdmin
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
        avatarUrl={profile.avatar_url}
      >
        {project.status === "ARCHIVED" ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 w-full">
            <div className="max-w-md w-full bg-surface p-8 rounded-xl border border-outline-variant/40">
              <div className="w-16 h-16 bg-error-container/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-on-surface mb-2">Project Archived</h2>
              <p className="text-on-surface-variant mb-0">Communicate with the Admin.</p>
            </div>
          </div>
        ) : (
          props.children
        )}
      </ProjectAdminShell>
    )
  } catch (error) {
    console.error("Project Admin Auth Error:", error)
    redirect("/login")
  }
}
