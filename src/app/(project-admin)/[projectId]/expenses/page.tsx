"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { ExpensesClient } from "./ExpensesClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ExpensesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/expenses`, fetcher)

  if (!data) return <Loading />

  return (
    <div className="max-w-7xl mx-auto">
      <ExpensesClient
        projectId={projectId}
        expenses={data.expenses}
        milestones={data.milestones}
        categories={data.categories}
      />
    </div>
  )
}
