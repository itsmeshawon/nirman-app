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

  if (penaltyConfig.penalty_type === 'FIXED_AMOUNT') {
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

  // 3. Pre-calculate all penalty values, discard items with no penalty
  const itemsWithPenalties = unpaidItems
    .map((item: any) => ({ item, penaltyValue: calculatePenalty(item, config) }))
    .filter(({ penaltyValue }: any) => penaltyValue > 0)

  if (itemsWithPenalties.length > 0) {
    // Single batch read — fetch ALL existing penalties at once
    const itemIds = itemsWithPenalties.map(({ item }: any) => item.id)
    const { data: existingPenalties } = await supabase
      .from("penalties")
      .select("*")
      .in("schedule_item_id", itemIds)

    // Map for O(1) lookup per item
    const penaltyByItemId = new Map<string, any>(
      (existingPenalties || []).map((p: any) => [p.schedule_item_id, p])
    )

    // Collect all writes — zero DB calls in this loop
    const now = new Date().toISOString()
    const toInsert: any[] = []
    const toUpdate: any[] = []
    const toMarkOverdue: string[] = []

    for (const { item, penaltyValue } of itemsWithPenalties) {
      const existing = penaltyByItemId.get(item.id)

      if (existing) {
        if (existing.is_waived) continue
        if (existing.amount !== penaltyValue) {
          toUpdate.push({ id: existing.id, amount: penaltyValue, calculated_at: now })
          appliedCount++
        }
      } else {
        toInsert.push({ schedule_item_id: item.id, amount: penaltyValue, calculated_at: now })
        if (item.status === 'DUE') toMarkOverdue.push(item.id)
        appliedCount++
      }
    }

    // Execute all writes in 3 parallel queries — regardless of how many items there are
    await Promise.all([
      toInsert.length
        ? supabase.from("penalties").insert(toInsert)
        : Promise.resolve(),
      toUpdate.length
        ? supabase.from("penalties").upsert(toUpdate)
        : Promise.resolve(),
      toMarkOverdue.length
        ? supabase.from("schedule_items").update({ status: 'OVERDUE' }).in("id", toMarkOverdue)
        : Promise.resolve(),
    ])
  }

  return { appliedCount, message: `Successfully swept ${appliedCount} penalties.` }
}
