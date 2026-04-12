import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"

export async function GET(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Validate admin (or staff). In the context of the admin module, we require admin access.
    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    // Fetch expenses with category and milestone details
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(`
        *,
        category:expense_categories(id, name),
        milestone:milestones(id, name)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json({ expenses }, { status: 200 })
  } catch (err: any) {
    console.error("GET Expenses Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  const params = await props.params;
  const { projectId } = params;

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try { await requireProjectAdmin(supabase, projectId) } 
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }) }

    const body = await request.json()
    
    // Server-side validation with Zod
    const { expenseSchema } = await import("@/lib/validations")
    const validated = expenseSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validated.error.errors[0].message 
      }, { status: 400 })
    }

    const { milestone_id, title, category_id, amount, date, vat_amount, invoice_no, notes } = validated.data

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        project_id: projectId,
        milestone_id,
        category_id,
        title,
        amount,
        date,
        vat_amount,
        invoice_no,
        notes,
        status: "DRAFT", // Always draft on creation
        created_by_id: user.id
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAction({
      projectId,
      userId: user.id,
      action: "CREATE_EXPENSE",
      entityType: "expense",
      entityId: expense.id,
      details: { title, status: "DRAFT", amount }
    })

    return NextResponse.json({ success: true, expense }, { status: 200 })

  } catch (err: any) {
    console.error("POST Expense Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
