import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    await requireProjectAdmin(supabase, projectId)

    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single()

    const { data: shareholders } = await supabase
      .from("shareholders")
      .select("id, unit_flat, ownership_pct, profiles(name, email)")
      .eq("project_id", projectId)

    if (!shareholders?.length) {
      return NextResponse.json({ error: "No shareholders found" }, { status: 404 })
    }

    const shareholderIds = shareholders.map(s => s.id)

    const { data: scheduleItems } = await supabase
      .from("schedule_items")
      .select("shareholder_id, amount, status")
      .in("shareholder_id", shareholderIds)

    const { data: penalties } = await supabase
      .from("penalties")
      .select("shareholder_id, amount, status")
      .in("shareholder_id", shareholderIds)
      .eq("status", "ACTIVE")

    const rows = [
      ["NirmaN — Collection Summary Report"],
      [`Project: ${project?.name}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Unit", "Owner Name", "Email", "Ownership %", "Total Due (৳)", "Total Paid (৳)", "Overdue (৳)", "Active Penalties (৳)", "Collection Rate"],
    ]

    for (const sh of shareholders) {
      const myItems = scheduleItems?.filter(i => i.shareholder_id === sh.id) || []
      const myPenalties = penalties?.filter(p => p.shareholder_id === sh.id) || []
      const totalDue = myItems.reduce((s, i) => s + (i.amount || 0), 0)
      const totalPaid = myItems.filter(i => i.status === "PAID").reduce((s, i) => s + (i.amount || 0), 0)
      const overdue = myItems.filter(i => i.status === "OVERDUE").reduce((s, i) => s + (i.amount || 0), 0)
      const penaltiesTotal = myPenalties.reduce((s, p) => s + (p.amount || 0), 0)
      const rate = totalDue > 0 ? `${Math.round((totalPaid / totalDue) * 100)}%` : "N/A"

      const profile = Array.isArray(sh.profiles) ? sh.profiles[0] : sh.profiles as any
      rows.push([
        sh.unit_flat,
        profile?.name || "",
        profile?.email || "",
        String(sh.ownership_pct),
        totalDue.toLocaleString(),
        totalPaid.toLocaleString(),
        overdue.toLocaleString(),
        penaltiesTotal.toLocaleString(),
        rate,
      ])
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="collection-summary-${projectId.slice(0,8)}.csv"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
