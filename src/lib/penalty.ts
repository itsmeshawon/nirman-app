import { createClient } from "@supabase/supabase-js"

/**
 * Penalty Engine Core
 * Evaluates a single schedule item's overdue metrics against configuration
 */
export function calculatePenalty(
  scheduleItem: any,
  penaltyConfig: any,
  asOfDate: Date = new Date()
): number {
  if (!scheduleItem || !penaltyConfig) return 0
  if (scheduleItem.status === 'PAID') return 0

  const dueDate = new Date(scheduleItem.due_date)
  const currentDate = new Date(asOfDate)
  
  // Calculate raw overdue days
  const timeDiff = currentDate.getTime() - dueDate.getTime()
  let overdueDays = Math.floor(timeDiff / (1000 * 3600 * 24))

  // If not overdue, or still in grace period, penalty is 0
  if (overdueDays <= (penaltyConfig.grace_days || 0)) {
    return 0
  }

  const dueAmount = parseFloat(scheduleItem.amount) || 0
  let penaltyAmount = 0

  if (penaltyConfig.penalty_type === 'FIXED') {
    penaltyAmount = parseFloat(penaltyConfig.fixed_amount) || 0
  } 
  else if (penaltyConfig.penalty_type === 'PERCENT_OF_DUE') {
    const rate = parseFloat(penaltyConfig.percent_rate) || 0
    penaltyAmount = dueAmount * (rate / 100)
  }
  else if (penaltyConfig.penalty_type === 'DAILY_PERCENT') {
    const dailyRate = parseFloat(penaltyConfig.daily_rate) || 0
    penaltyAmount = dueAmount * (dailyRate / 100) * overdueDays
  }

  // Enforce Cap
  if (penaltyConfig.cap && penaltyAmount > penaltyConfig.cap) {
    penaltyAmount = penaltyConfig.cap
  }

  return Math.max(0, penaltyAmount)
}

/**
 * Sweeps through all OVERDUE/PARTIALLY_PAID items and updates penalties table
 * Called by API Route / Chron
 */
export async function applyPendingPenalties(projectId: string, supabase: any) {
  // 1. Fetch active penalty config for this project
  const { data: config } = await supabase
    .from("penalty_configs")
    .select("*")
    .eq("project_id", projectId)
    .single()

  if (!config) return { appliedCount: 0, message: "No active penalty configuration." }

  // 2. Fetch all unpaid items
  const { data: unpaidItems } = await supabase
    .from("schedule_items")
    .select("*, payment_schedules!inner(project_id)")
    .eq("payment_schedules.project_id", projectId)
    .in("status", ["DUE", "OVERDUE", "PARTIALLY_PAID"])
    
  if (!unpaidItems || unpaidItems.length === 0) return { appliedCount: 0, message: "No pending items." }

  let appliedCount = 0

  // 3. Evaluate each item
  for (const item of unpaidItems) {
    const penaltyValue = calculatePenalty(item, config)

    if (penaltyValue > 0) {
       // Check if penalty row already exists
       const { data: existingPenalty } = await supabase
         .from("penalties")
         .select("*")
         .eq("schedule_item_id", item.id)
         .single()

       if (existingPenalty) {
          if (existingPenalty.is_waived) continue // Skip waived
          
          if (existingPenalty.amount !== penaltyValue) {
             await supabase
               .from("penalties")
               .update({ amount: penaltyValue, calculated_at: new Date().toISOString() })
               .eq("id", existingPenalty.id)
             appliedCount++
          }
       } else {
          // Insert new penalty row
          await supabase
            .from("penalties")
            .insert({
               schedule_item_id: item.id,
               amount: penaltyValue,
               calculated_at: new Date().toISOString()
            })
          
          // Also mark the schedule_item as OVERDUE if it was just DUE
          if (item.status === 'DUE') {
             await supabase
               .from("schedule_items")
               .update({ status: 'OVERDUE' })
               .eq("id", item.id)
          }

          appliedCount++
       }
    }
  }

  return { appliedCount, message: `Successfully swept ${appliedCount} penalties.` }
}
