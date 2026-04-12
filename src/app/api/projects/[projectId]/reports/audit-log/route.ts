import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    await requireProjectAdmin(supabase, projectId)

    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single()

    const { data: logs } = await supabaseAdmin
      .from("audit_logs")
      .select("action, entity_type, entity_id, details, ip_address, created_at, user_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1000)

    const rows = [
      ["NirmaN — Audit Log Report"],
      [`Project: ${project?.name}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Timestamp", "Action", "Entity Type", "Entity ID", "User ID", "Details"],
    ]

    for (const log of logs || []) {
      rows.push([
        new Date(log.created_at).toLocaleString(),
        log.action,
        log.entity_type || "",
        log.entity_id || "",
        log.user_id || "",
        log.details ? JSON.stringify(log.details) : "",
      ])
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${projectId.slice(0,8)}.csv"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
