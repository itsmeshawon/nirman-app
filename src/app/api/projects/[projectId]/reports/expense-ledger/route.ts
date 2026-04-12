import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireProjectAdmin } from "@/lib/permissions"
import { formatBDT } from "@/lib/utils"

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  try {
    const supabase = await createClient()
    await requireProjectAdmin(supabase, projectId)

    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single()

    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, category:expense_categories(name), milestone:milestones(name)")
      .eq("project_id", projectId)
      .eq("status", "PUBLISHED")
      .order("date", { ascending: true })

    const rows = [
      ["NirmaN — Expense Ledger Report"],
      [`Project: ${project?.name}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Date", "Title", "Category", "Milestone", "Amount (৳)", "VAT (৳)", "Total (৳)", "Invoice No"],
    ]

    let grandTotal = 0
    for (const e of expenses || []) {
      const total = (e.amount || 0) + (e.vat_amount || 0)
      grandTotal += total
      rows.push([
        new Date(e.date).toLocaleDateString(),
        e.title,
        e.category?.name || "",
        e.milestone?.name || "",
        (e.amount || 0).toLocaleString(),
        (e.vat_amount || 0).toLocaleString(),
        total.toLocaleString(),
        e.invoice_no || "",
      ])
    }
    rows.push([])
    rows.push(["", "", "", "", "", "GRAND TOTAL", grandTotal.toLocaleString(), ""])

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="expense-ledger-${projectId.slice(0,8)}.csv"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
