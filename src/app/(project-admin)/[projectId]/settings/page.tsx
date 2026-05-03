"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { ProjectSettingsClient } from "./ProjectSettingsClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/settings`, fetcher)

  if (!data) return <Loading />

  return (
    <ProjectSettingsClient
      projectId={projectId}
      project={data.project}
      paymentSchedule={data.paymentSchedule}
      penaltyConfig={data.penaltyConfig}
      notificationConfig={data.notificationConfig}
    />
  )
}
