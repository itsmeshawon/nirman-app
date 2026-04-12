import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Bangladeshi Taka with lakhs/crores grouping.
 * Example: 1250000 → "৳12,50,000"
 */
export function formatBDT(amount: number): string {
  const str = Math.round(amount).toString()
  // Bangladeshi format: last 3 digits, then groups of 2
  if (str.length <= 3) return `৳${str}`

  const last3 = str.slice(-3)
  const rest = str.slice(0, -3)
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `৳${grouped},${last3}`
}

/**
 * Format a date as "15 Jan 2026"
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy")
}

/**
 * Format a date as "15 Jan 2026, 02:30 PM"
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy, hh:mm aa").replace("am", "AM").replace("pm", "PM")
}

/**
 * Generate a receipt number.
 * Example: generateReceiptNo("GVH", 0) → "NRM-GVH-20260415-001"
 */
export function generateReceiptNo(projectCode: string, existingCount: number): string {
  const dateStr = format(new Date(), "yyyyMMdd")
  const seq = String(existingCount + 1).padStart(3, "0")
  return `NRM-${projectCode}-${dateStr}-${seq}`
}
