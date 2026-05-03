import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProjectDataProvider from "@/components/layouts/ProjectDataProvider"

export default async function ProjectAdminLayout(props: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <ProjectDataProvider projectId={projectId}>
      {props.children}
    </ProjectDataProvider>
  )
}
