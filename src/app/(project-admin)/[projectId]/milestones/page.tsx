"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { MilestoneTimeline } from "./MilestoneTimeline"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function MilestonesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/milestones`, fetcher)

  if (!data) return <Loading />

  return (
    <div className="w-full">
      <MilestoneTimeline
        projectId={projectId}
        initialMilestones={data.milestones}
        expenseTotals={data.expenseTotals}
      />
    </div>
  )
}
