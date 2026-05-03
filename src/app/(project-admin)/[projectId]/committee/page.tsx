"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { CommitteeClient } from "./CommitteeClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CommitteePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/committee`, fetcher)

  if (!data) return <Loading />

  return (
    <CommitteeClient
      projectId={projectId}
      currentRule={data.currentRule}
      members={data.members}
      availableShareholders={data.availableShareholders}
    />
  )
}
