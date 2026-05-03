"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { FeedClient } from "./FeedClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function FeedPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/feed`, fetcher)

  if (!data) return <Loading />

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <FeedClient
        projectId={projectId}
        initialPosts={data.posts}
        milestones={data.milestones}
        userId={data.userId}
        userName={data.userName}
      />
    </div>
  )
}
