import { supabaseAdmin } from "@/lib/supabase/admin"

interface NotificationPayload {
  userId: string
  projectId?: string
  type: string
  title: string
  body?: string
  linkUrl?: string
}

export async function createNotification(payload: NotificationPayload) {
  await supabaseAdmin.from("notifications").insert({
    user_id: payload.userId,
    project_id: payload.projectId || null,
    type: payload.type,
    title: payload.title,
    body: payload.body || null,
    link_url: payload.linkUrl || null,
    is_read: false,
  })
}

export async function createNotificationsForMany(userIds: string[], payload: Omit<NotificationPayload, "userId">) {
  if (!userIds.length) return
  const rows = userIds.map((userId) => ({
    user_id: userId,
    project_id: payload.projectId || null,
    type: payload.type,
    title: payload.title,
    body: payload.body || null,
    link_url: payload.linkUrl || null,
    is_read: false,
  }))
  await supabaseAdmin.from("notifications").insert(rows)
}
