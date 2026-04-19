import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { DocumentsClient } from "./DocumentsClient"

export const dynamic = "force-dynamic"

export default async function DocumentsPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params
  const { projectId } = params

  const { data: documents } = await supabaseAdmin
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false })

  return (
    <div className="w-full">
      <DocumentsClient 
        projectId={projectId} 
        initialDocuments={documents || []} 
      />
    </div>
  )
}

