import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    await requireProjectAdmin(supabase, projectId)

    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single()

    const { data: schedules } = await supabase.from("payment_schedules").select("id").eq("project_id", projectId)
    const scheduleIds = schedules?.map(s => s.id) || []

    const { data: overdueItems } = await supabase
      .from("schedule_items")
      .select(`
        id, amount, due_date, status,
        shareholder:shareholders(id, unit_flat, profiles(name, email, phone)),
        milestone:milestones(name)
      `)
      .in("schedule_id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "OVERDUE")
      .order("due_date", { ascending: true })

    const rows = [
      ["NirmaN — Defaulters Report"],
      [`Project: ${project?.name}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Unit", "Owner Name", "Email", "Phone", "Milestone", "Due Date", "Amount Overdue (৳)", "Days Overdue"],
    ]

    const today = new Date()
    for (const item of overdueItems || []) {
      const sh = Array.isArray(item.shareholder) ? item.shareholder[0] : item.shareholder as any
      const profile = sh ? (Array.isArray(sh.profiles) ? sh.profiles[0] : sh.profiles) : null
      const daysOverdue = Math.floor((today.getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))
      rows.push([
        sh?.unit_flat || "",
        profile?.name || "",
        profile?.email || "",
        profile?.phone || "",
        (item.milestone as any)?.name || "",
        new Date(item.due_date).toLocaleDateString(),
        (item.amount || 0).toLocaleString(),
        String(daysOverdue),
      ])
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="defaulters-${projectId.slice(0,8)}.csv"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
