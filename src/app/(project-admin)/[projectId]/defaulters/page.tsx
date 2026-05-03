"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { DefaultersClient } from "./DefaultersClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProjectDefaultersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/defaulters`, fetcher)

  if (!data) return <Loading />

  return (
    <div className="w-full">
      <DefaultersClient
        projectId={projectId}
        overdueItems={data.overdueItems}
        payments={data.payments}
      />
    </div>
  )
}
