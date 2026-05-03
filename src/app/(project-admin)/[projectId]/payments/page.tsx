"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { PaymentsClient } from "./PaymentsClient"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PaymentsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/payments`, fetcher)

  if (!data) return <Loading />

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <PaymentsClient
        projectId={projectId}
        scheduleItems={data.scheduleItems}
        payments={data.payments}
        shareholders={data.shareholders}
        milestones={data.milestones}
        paymentProofs={data.paymentProofs}
      />
    </div>
  )
}
