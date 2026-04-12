import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch stats in parallel
    const [projectsRes, shareholdersRes, auditRes] = await Promise.all([
      supabase.from("projects").select("id, status"),
      supabase.from("shareholders").select("id", { count: "exact", head: true }),
      supabase.from("audit_logs").select("created_at").order("created_at", { ascending: false }).limit(1),
    ])

    const projects = projectsRes.data ?? []
    const totalProjects = projects.length
    const activeProjects = projects.filter((p) =>
      ["ACTIVE", "PILOT"].includes(p.status)
    ).length
    const totalShareholders = shareholdersRes.count ?? 0
    const lastActivity = auditRes.data?.[0]?.created_at ?? null

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalShareholders,
      lastActivity,
    })
  } catch (err) {
    console.error("[platform stats]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
