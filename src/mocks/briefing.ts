import type { DailyBriefing } from '@/types'

export const mockBriefing: DailyBriefing = {
  date: '2026-03-28',
  generatedAt: '2026-03-28T06:00:00Z',
  kpiChanges: [
    {
      metric: 'Daily TTV',
      yesterday: 620_000_000,
      today: 685_000_000,
      change: 65_000_000,
      changePercent: 10.5,
    },
    {
      metric: 'Daily Bookings',
      yesterday: 312,
      today: 345,
      change: 33,
      changePercent: 10.6,
    },
    {
      metric: 'Cancel Rate (7d avg)',
      yesterday: 7.2,
      today: 8.1,
      change: 0.9,
      changePercent: 12.5,
    },
  ],
  urgentClients: [
    {
      clientId: 'c2',
      clientName: 'Trip.com Group',
      reason: '신용 한도 96% 사용 — 잔여 한도 \u00a5480M, 금일 결제 확인 필요',
      severity: 'critical',
    },
    {
      clientId: 'c13',
      clientName: 'Tiket.com',
      reason: '신용 한도 98% 사용 — 예약 차단 임박, 긴급 조치 필요',
      severity: 'critical',
    },
    {
      clientId: 'c15',
      clientName: 'Vietnam Travel Group',
      reason: '취소율 18.7%로 급등 — 베트남 호텔 품질 이슈 확인 필요',
      severity: 'warning',
    },
  ],
  todaySchedule: [
    {
      time: '10:00',
      title: 'Trip.com Q2 계약 갱신 미팅',
      type: 'meeting',
    },
    {
      time: '14:00',
      title: 'Traveloka 예약 급증 대응 — 재고 확보 논의',
      type: 'call',
    },
    {
      time: '16:30',
      title: 'Q3 KPI 목표 설정 내부 리뷰',
      type: 'internal',
    },
  ],
  actionItems: [
    {
      priority: 'high',
      description: 'Trip.com 신용 한도 증액 요청서 작성 및 재무팀 제출',
      clientName: 'Trip.com Group',
    },
    {
      priority: 'high',
      description: 'Tiket.com 미수금 현황 확인 및 결제 독촉 연락',
      clientName: 'Tiket.com',
    },
    {
      priority: 'medium',
      description: 'Vietnam Travel Group 취소율 상승 원인 분석 리포트 작성',
      clientName: 'Vietnam Travel Group',
    },
    {
      priority: 'low',
      description: 'Q2 실적 보고서 초안 준비 — 경영진 발표용',
    },
  ],
}
