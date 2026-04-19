import { getSupabaseAdmin } from "@/lib/supabase/admin"

interface LogActionParams {
  projectId?: string
  userId: string
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}

export async function logAction({
  projectId,
  userId,
  action,
  entityType,
  entityId,
  details,
}: LogActionParams) {
  const { error } = await getSupabaseAdmin().from("audit_logs").insert({
    project_id: projectId ?? null,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null,
  })

  if (error) {
    console.error("[audit] Failed to log action:", error.message)
  }
}
