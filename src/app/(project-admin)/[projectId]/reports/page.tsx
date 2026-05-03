"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { ReportsClient } from "./ReportsClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/reports`, fetcher)

  if (!data) return <Loading />

  return (
    <ReportsClient
      projectId={projectId}
      chartData={data.chartData}
      summary={data.summary}
    />
  )
}
