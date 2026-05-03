"use client"

import { createContext, useContext } from "react"

export type ShellData = {
  project: { name: string; status: string } | null
  profile: { name: string; avatar_url: string | null } | null
}

type ContextValue = {
  projectId: string
  shellData: ShellData | null
  isLoading: boolean
}

export const ProjectAdminContext = createContext<ContextValue>({
  projectId: "",
  shellData: null,
  isLoading: true,
})

export function useProjectAdmin() {
  return useContext(ProjectAdminContext)
}
