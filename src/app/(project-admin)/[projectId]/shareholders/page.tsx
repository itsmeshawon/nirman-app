"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { ShareholdersTable } from "./ShareholdersTable"
import { usePageTitle } from "@/context/PageTitleContext"
import Loading from "./loading"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ShareholdersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useSWR(`/api/projects/${projectId}/page-data/shareholders`, fetcher)
  const { setPageTitleSuffix } = usePageTitle()

  useEffect(() => {
    if (data?.shareholders) {
      setPageTitleSuffix(`(${data.shareholders.length})`)
    }
    return () => setPageTitleSuffix(null)
  }, [data?.shareholders?.length])

  if (!data) return <Loading />

  return (
    <div className="w-full">
      <ShareholdersTable
        projectId={projectId}
        data={data.shareholders}
        committeeShareholderIds={data.committeeShareholderIds}
      />
    </div>
  )
}
