import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { logAction } from "@/lib/audit"
import { requireProjectAdmin } from "@/lib/permissions"
import { createNotification } from "@/lib/notifications"

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
    const { paymentSchema } = await import("@/lib/validations")
    const validated = paymentSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validated.error.issues[0]?.message 
      }, { status: 400 })
    }

    const { shareholder_id, schedule_item_id, amount, method, reference_no, notes, attachment_path, waive_penalties } = validated.data
    const payAmount = amount

    // 1. Handle Penalty Waiving if requested
    if (waive_penalties) {
      // Find all schedule items for this shareholder
      const { data: shItems } = await supabase
        .from("schedule_items")
        .select("id")
        .eq("shareholder_id", shareholder_id)
      
      const shItemIds = shItems?.map(i => i.id) || []
      
      if (shItemIds.length > 0) {
        await supabase
          .from("penalties")
          .update({ is_waived: true })
          .in("schedule_item_id", shItemIds)
          .eq("is_waived", false)
      }
    }

    // 2. Generate Receipt No (NRM-[PROJECT]-YYYYMMDD-[SEQ])
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .like('receipt_no', `NRM-${projectId.slice(0,4).toUpperCase()}-${todayStr}-%`)

    const seq = String((count || 0) + 1).padStart(3, '0')
    const receipt_no = `NRM-${projectId.slice(0,4).toUpperCase()}-${todayStr}-${seq}`

    // 2. Insert Payment
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .insert({
         shareholder_id,
         schedule_item_id: schedule_item_id || null, // null if manual ad-hoc payment
         amount: payAmount,
         method,
         reference_no: reference_no || null,
         notes: notes || null,
         attachment_path: attachment_path || null,
         receipt_no,
         recorded_by_id: user.id
      })
      .select()
      .single()

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })

    // 3. Update ScheduleItem sequentially if linked
    if (schedule_item_id) {
       // get all payments for this schedule item to calculate total paid
       const { data: allPayments } = await supabase
         .from("payments")
         .select("amount")
         .eq("schedule_item_id", schedule_item_id)
         
       const totalPaid = allPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || payAmount

       // get expected amount to determine new status
       const { data: scheduleItem } = await supabase
         .from("schedule_items")
         .select("amount")
         .eq("id", schedule_item_id)
         .single()

       let newStatus = "PARTIALLY_PAID"
       if (scheduleItem && totalPaid >= parseFloat(scheduleItem.amount)) {
          newStatus = "PAID"
       }

       await supabase
         .from("schedule_items")
         .update({ status: newStatus })
         .eq("id", schedule_item_id)
    }

    // 4. Log Action
    await logAction({
       projectId,
       userId: user.id,
       action: "RECORD_PAYMENT",
       entityType: "payment",
       entityId: payment.id,
       details: { amount: payAmount, method, receipt_no }
    })

    // 5. Notify the shareholder who received the payment
    try {
      const { data: shareholder } = await supabaseAdmin
        .from("shareholders")
        .select("user_id")
        .eq("id", shareholder_id)
        .single()

      if (shareholder?.user_id) {
        await createNotification({
          userId: shareholder.user_id,
          projectId,
          type: "PAYMENT_RECORDED",
          title: "Payment recorded",
          body: `৳${payAmount.toLocaleString()} received via ${method}`,
          linkUrl: "/my/payments",
        })
      }
    } catch (notifErr) {
      console.error("[notifications] Failed to notify shareholder about payment:", notifErr)
    }

    return NextResponse.json({ success: true, payment }, { status: 200 })

  } catch (err: any) {
    console.error("Payment error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
