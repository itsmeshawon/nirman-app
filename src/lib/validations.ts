import { z } from "zod"

// --- Common Schemas ---
export const moneySchema = z.coerce.number().min(0).max(99999999999999)
export const dateSchema = z.string().transform((str) => new Date(str)).refine((date) => {
  const year = date.getFullYear()
  return year >= 2000 && year <= 2100
}, { message: "Date must be between year 2000 and 2100" })

// --- Document Schema ---
export const DOCUMENT_CATEGORIES = [
  "Land Documents",
  "Floor Plans",
  "Electrical Drawings",
  "Architectural Drawings",
  "Legal",
  "Other"
] as const

export const documentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  category: z.enum(DOCUMENT_CATEGORIES),
  file_path: z.string(),
  file_type: z.string(),
  file_size: z.number().nullable().optional(),
})

// --- Expense Schema ---
export const expenseSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  amount: moneySchema,
  date: z.string().or(z.date()).transform(d => new Date(d).toISOString()),
  category_id: z.string().uuid(),
  milestone_id: z.string().uuid().nullable().optional(),
  vat_amount: moneySchema.optional().default(0),
  invoice_no: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

// --- Payment Schema ---
export const paymentSchema = z.object({
  shareholder_id: z.string().uuid(),
  schedule_item_id: z.string().uuid().nullable().optional(),
  amount: moneySchema,
  method: z.enum(["CASH", "BANK_TRANSFER", "BKASH", "NAGAD", "CHEQUE"]),
  reference_no: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  attachment_path: z.string().nullable().optional(),
  waive_penalties: z.boolean().optional().default(false),
})

// --- Post Schema ---
export const postSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().min(5, "Description must be at least 5 characters").max(5000),
  media_url: z.string().nullable().optional(),
  media_type: z.enum(["IMAGE", "VIDEO", "AUDIO"]).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
})
