import { useState, useMemo, useEffect, useRef } from 'react'
import { X, CheckCheck, Trash2, Bell, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { mockAlerts } from '@/mocks/alerts'
import type { Notification, AlertSeverity } from '@/types'

const SEVERITY_STRIPE: Record<AlertSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

const FILTER_TABS = ['전체', 'Credit', 'Booking', 'System'] as const
type FilterTab = typeof FILTER_TABS[number]

function alertToNotification(alert: typeof mockAlerts[number]): Notification {
  const typeMap: Record<string, Notification['type']> = {
    credit_usage: 'credit',
    credit_overdue: 'credit',
    booking_surge: 'booking',
    booking_drop: 'booking',
    cancel_rate: 'system',
    capacity_risk: 'system',
  }
  return {
    id: `n-${alert.id}`,
    type: typeMap[alert.type] || 'system',
    title: `${alert.clientName} — ${alert.type.replace(/_/g, ' ')}`,
    message: alert.message,
    severity: alert.severity,
    read: alert.status !== 'created',
    createdAt: alert.createdAt,
    linkedAlertId: alert.id,
    linkedClientId: alert.clientId,
  }
}

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export default function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<FilterTab>('전체')
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    mockAlerts.map(alertToNotification)
  )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    if (filter === '전체') return notifications
    const typeMap: Record<string, Notification['type']> = {
      Credit: 'credit',
      Booking: 'booking',
      System: 'system',
    }
    return notifications.filter(n => n.type === typeMap[filter])
  }, [notifications, filter])

  const unreadCount = notifications.filter(n => !n.read).length

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('모든 알림을 읽음으로 표시했습니다')
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function deleteNotification(notification: Notification) {
    setNotifications(prev => prev.filter(n => n.id !== notification.id))
    toast('알림이 삭제되었습니다', {
      action: {
        label: '되돌리기',
        onClick: () => {
          setNotifications(prev => [...prev, notification].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ))
        },
      },
    })
  }

  function formatTimestamp(iso: string) {
    const date = new Date(iso)
    const now = new Date('2026-03-28T12:00:00Z')
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return '방금 전'
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/20" />}

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-card border-l border-border shadow-xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">알림 센터</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md hover:bg-accent transition-colors"
              title="모두 읽음"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              모두 읽음
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-5 pt-3 gap-1 shrink-0">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                filter === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">알림이 없습니다</p>
            </div>
          ) : (
            filtered.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  'flex gap-3 p-3 rounded-lg cursor-pointer transition-colors group',
                  n.read ? 'bg-background hover:bg-accent/50' : 'bg-accent/70 hover:bg-accent'
                )}
              >
                {/* Severity stripe */}
                <div className={cn('w-1 rounded-full shrink-0 self-stretch', SEVERITY_STRIPE[n.severity])} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-tight', !n.read && 'font-semibold')}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted-foreground">
                      {formatTimestamp(n.createdAt)}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(n) }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
