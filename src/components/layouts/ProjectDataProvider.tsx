"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProjectAdminContext, ShellData } from "@/context/ProjectAdminContext"
import ProjectAdminShell from "./ProjectAdminShell"

export default function ProjectDataProvider({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactNode
}) {
  const [shellData, setShellData] = useState<ShellData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/projects/${projectId}/shell`)
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/login")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) setShellData(data)
        setIsLoading(false)
      })
  }, [projectId, router])

  return (
    <ProjectAdminContext.Provider value={{ projectId, shellData, isLoading }}>
      <ProjectAdminShell
        projectId={projectId}
        projectName={shellData?.project?.name ?? ""}
        projectStatus={shellData?.project?.status ?? ""}
        profileName={shellData?.profile?.name ?? ""}
        avatarUrl={shellData?.profile?.avatar_url}
        isArchived={shellData?.project?.status === "ARCHIVED"}
        isLoading={isLoading}
      >
        {children}
      </ProjectAdminShell>
    </ProjectAdminContext.Provider>
  )
}
