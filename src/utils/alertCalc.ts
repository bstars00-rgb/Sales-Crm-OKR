import type { Alert, AlertSeverity, AlertType, Client } from '@/types'

/**
 * Evaluate alert thresholds for a client and return any triggered alerts.
 * Tier 1~3 + 신규 11타입 알림 시스템과 호환 (FR-010).
 */
export function evaluateAlerts(client: Client): Alert[] {
  const alerts: Alert[] = []
  const now = new Date().toISOString()
  const usagePct = client.creditUsagePercent ?? 0

  // --- Credit Usage ---
  if (usagePct >= 95) {
    alerts.push({
      id: `alert-credit-${client.id}`,
      clientId: client.id,
      clientName: client.name,
      channelId: client.id,
      channelName: client.name,
      type: 'credit_usage',
      severity: 'critical',
      status: 'created',
      message: `신용 한도 사용률 ${usagePct.toFixed(1)}% — 즉시 조치 필요`,
      value: usagePct,
      threshold: 95,
      createdAt: now,
    })
  } else if (usagePct >= 80) {
    alerts.push({
      id: `alert-credit-${client.id}`,
      clientId: client.id,
      clientName: client.name,
      channelId: client.id,
      channelName: client.name,
      type: 'credit_usage',
      severity: 'high',
      status: 'created',
      message: `신용 한도 사용률 ${usagePct.toFixed(1)}% — 주의 필요`,
      value: usagePct,
      threshold: 80,
      createdAt: now,
    })
  }

  return alerts
}

/**
 * Tailwind color class for alert severity (다크모드 포함).
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    critical: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30',
    high: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30',
    medium: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30',
    warning: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30',
    info: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30',
  }
  return colors[severity]
}

/**
 * Korean label for alert type (FR-010 11타입 전체).
 */
export function getAlertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    credit_usage: '신용 한도 초과',
    credit_overdue: '미수금 연체',
    booking_surge: '예약 급증',
    booking_drop: '예약 급감',
    cancel_rate: '취소율 상승',
    capacity_risk: '재고 위험',
    pipeline_stale: 'Pipeline SLA 초과',
    ctrip_threshold_breach: 'Ctrip 의존도 초과',
    china_threshold_breach: 'China 의존도 초과',
    contract_expiring: '계약 만료 임박',
    task_overdue: 'Task 미완료',
  }
  return labels[type]
}
