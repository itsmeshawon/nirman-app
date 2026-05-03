"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import ActivityLogClient from "./ActivityLogClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ActivityLogPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/activity-log`, fetcher)

  if (!data) return <Loading />

  return (
    <div className="space-y-6 pb-12">
      <ActivityLogClient logs={data.logs} />
    </div>
  )
}
