"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Banknote,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  XCircle,
  RefreshCw,
  Megaphone,
  Camera,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType =
  | "PAYMENT_REMINDER"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_RECORDED"
  | "EXPENSE_SUBMITTED"
  | "EXPENSE_APPROVED"
  | "EXPENSE_REJECTED"
  | "EXPENSE_CHANGES_REQUESTED"
  | "EXPENSE_PUBLISHED"
  | "ACTIVITY_POST"
  | "PENALTY_APPLIED"

interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  link_url?: string | null
  is_read: boolean
  created_at: string
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

// ─── Icon + colour config ─────────────────────────────────────────────────────

const typeConfig: Record<
  NotificationType,
  { Icon: React.ElementType; bg: string; text: string }
> = {
  PAYMENT_REMINDER:          { Icon: Banknote,      bg: "bg-tertiary-container/40",  text: "text-tertiary"  },
  PAYMENT_OVERDUE:           { Icon: AlertTriangle, bg: "bg-error-container/50",    text: "text-destructive"    },
  PAYMENT_RECORDED:          { Icon: Banknote,      bg: "bg-primary-container/50",  text: "text-primary"  },
  EXPENSE_SUBMITTED:         { Icon: ClipboardList, bg: "bg-tertiary-container/50",   text: "text-tertiary"   },
  EXPENSE_APPROVED:          { Icon: CheckCircle,   bg: "bg-primary-container/50",  text: "text-primary"  },
  EXPENSE_REJECTED:          { Icon: XCircle,       bg: "bg-error-container/50",    text: "text-destructive"    },
  EXPENSE_CHANGES_REQUESTED: { Icon: RefreshCw,     bg: "bg-orange-100", text: "text-orange-600" },
  EXPENSE_PUBLISHED:         { Icon: Megaphone,     bg: "bg-primary-container/50",   text: "text-primary"   },
  ACTIVITY_POST:             { Icon: Camera,        bg: "bg-primary-container/50",   text: "text-primary"   },
  PENALTY_APPLIED:           { Icon: AlertTriangle, bg: "bg-orange-100", text: "text-orange-600" },
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  projectId?: string
}

export default function NotificationBell({ projectId }: NotificationBellProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const url = projectId
        ? `/api/notifications?projectId=${projectId}`
        : `/api/notifications`
      const res = await fetch(url)
      if (!res.ok) return
      const data: NotificationsResponse = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently fail — bell stays in loading/empty state
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── Outside click ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // ── Mark single read ───────────────────────────────────────────────────────

  const handleNotificationClick = async (notification: Notification) => {
    setOpen(false)
    if (!notification.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      try {
        await fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" })
      } catch {
        // revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: false } : n))
        )
        setUnreadCount((prev) => prev + 1)
      }
    }
    if (notification.link_url) {
      router.push(notification.link_url)
    }
  }

  // ── Mark all read ──────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" })
    } catch {
      // re-fetch to get true state
      fetchNotifications()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          width: "40px",
          height: "40px",
          backgroundColor: "var(--surface-container)",
          color: "var(--foreground)",
          border: "none",
          cursor: "pointer",
          transition: "background-color 200ms cubic-bezier(0.2, 0, 0, 1)",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--surface-container-high)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--surface-container)"
        }}
        aria-label="View notifications"
      >
        {/* Re-key wrapper triggers animate-bounce when unread count changes */}
        <span key={unreadCount} className={unreadCount > 0 ? "animate-bounce inline-flex" : "inline-flex"}>
          <Bell className="h-5 w-5" />
        </span>

        {/* Unread badge */}
        {!loading && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-error-container/200 px-0.5 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3 sticky top-0 bg-surface z-10">
            <span className="text-sm font-semibold text-on-surface">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary font-medium transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-outline">
              No notifications yet
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => {
                const config = typeConfig[notification.type] ?? typeConfig["ACTIVITY_POST"]
                const { Icon, bg, text } = config
                return (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-variant/20 ${
                        !notification.is_read
                          ? "border-l-2 border-primary bg-primary-container/20/30"
                          : "border-l-2 border-transparent bg-surface"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${bg}`}
                      >
                        <Icon className={`h-4 w-4 ${text}`} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                          {notification.body}
                        </p>
                        <p className="text-xs text-outline mt-1">
                          {relativeTime(notification.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
