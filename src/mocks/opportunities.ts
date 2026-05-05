import type { Opportunity, ForecastCategory } from '@/types'

// FR-026 Mock Opportunities — 한 채널에 여러 거래 동시 진행 (B2B Sales CRM 격상)
export const mockOpportunities: Opportunity[] = [
  // ===== Trip.com Group (c2) — 3건 동시 =====
  { id: 'op-001', channelId: 'c2', name: 'Trip.com 신규 호텔 200개 추가', type: 'NewIntegration', amount: 250_000_000, currency: 'JPY', closeDate: '2026-06-30', probability: 70, stage: 'Testing', ownerUserId: 'u-tm', sourceActivityIds: [], createdAt: '2026-04-10T09:00:00Z', updatedAt: '2026-04-25T14:00:00Z' },
  { id: 'op-002', channelId: 'c2', name: 'Trip.com Q3 25% off 프로모션', type: 'Promotion', amount: 80_000_000, currency: 'JPY', closeDate: '2026-05-30', probability: 90, stage: 'Testing', ownerUserId: 'u-tm', sourceActivityIds: [], createdAt: '2026-04-15T11:00:00Z', updatedAt: '2026-04-26T10:00:00Z' },
  { id: 'op-003', channelId: 'c2', name: 'Trip.com 연간 계약 갱신 2026', type: 'Renewal', amount: 180_000_000, currency: 'JPY', closeDate: '2026-12-31', probability: 50, stage: 'NDA', ownerUserId: 'u-tm', sourceActivityIds: [], createdAt: '2026-04-20T09:00:00Z', updatedAt: '2026-04-25T16:00:00Z' },

  // ===== Agoda (c3) — 2건 =====
  { id: 'op-004', channelId: 'c3', name: 'Agoda Q2 패키지 상품 확장', type: 'Expansion', amount: 60_000_000, currency: 'JPY', closeDate: '2026-06-15', probability: 80, stage: 'Testing', ownerUserId: 'u-grace', sourceActivityIds: [], createdAt: '2026-04-12T10:00:00Z', updatedAt: '2026-04-26T09:00:00Z' },
  { id: 'op-005', channelId: 'c3', name: 'Agoda 동남아 권역 추가', type: 'Upsell', amount: 45_000_000, currency: 'JPY', closeDate: '2026-07-31', probability: 40, stage: 'InDev', ownerUserId: 'u-grace', sourceActivityIds: [], createdAt: '2026-04-18T13:00:00Z', updatedAt: '2026-04-25T11:00:00Z' },

  // ===== Klook (c4) =====
  { id: 'op-006', channelId: 'c4', name: 'Klook 연간 갱신 + 단가 조정', type: 'Renewal', amount: 95_000_000, currency: 'JPY', closeDate: '2026-05-15', probability: 95, stage: 'Testing', ownerUserId: 'u-jane', sourceActivityIds: [], createdAt: '2026-04-05T09:00:00Z', updatedAt: '2026-04-25T15:00:00Z' },

  // ===== Booking.com (c5) =====
  { id: 'op-007', channelId: 'c5', name: 'Booking 신규 권역(중동) 추가', type: 'Upsell', amount: 120_000_000, currency: 'JPY', closeDate: '2026-08-30', probability: 30, stage: 'NDA', ownerUserId: 'u-jasmine', sourceActivityIds: [], createdAt: '2026-04-22T10:00:00Z', updatedAt: '2026-04-26T09:30:00Z' },

  // ===== HanaTour (c1) — Won 사례 =====
  { id: 'op-008', channelId: 'c1', name: 'HanaTour Spring 프로모션', type: 'Promotion', amount: 35_000_000, currency: 'JPY', closeDate: '2026-04-20', probability: 100, stage: 'Won', ownerUserId: 'u-tm', sourceActivityIds: [], createdAt: '2026-03-15T09:00:00Z', updatedAt: '2026-04-20T16:00:00Z' },

  // ===== Yanolja (c6) — Lost 사례 =====
  { id: 'op-009', channelId: 'c6', name: 'Yanolja Cloud 신규 통합', type: 'NewIntegration', amount: 70_000_000, currency: 'JPY', closeDate: '2026-04-15', probability: 0, stage: 'Lost', ownerUserId: 'u-jane', sourceActivityIds: [], lostReason: 'Pricing', decisionNote: '경쟁사 대비 단가 12% 높아 거래처 거부. 차기 협상 시 인하 검토 필요.', createdAt: '2026-02-20T09:00:00Z', updatedAt: '2026-04-15T18:00:00Z' },

  // ===== MakeMyTrip (c7) =====
  { id: 'op-010', channelId: 'c7', name: 'MakeMyTrip 연간 갱신', type: 'Renewal', amount: 65_000_000, currency: 'JPY', closeDate: '2026-09-30', probability: 60, stage: 'InDev', ownerUserId: 'u-tm', sourceActivityIds: [], createdAt: '2026-04-08T11:00:00Z', updatedAt: '2026-04-24T14:00:00Z' },

  // ===== Traveloka (c8) =====
  { id: 'op-011', channelId: 'c8', name: 'Traveloka SEA 프로모션', type: 'Promotion', amount: 40_000_000, currency: 'JPY', closeDate: '2026-06-01', probability: 75, stage: 'Testing', ownerUserId: 'u-grace', sourceActivityIds: [], createdAt: '2026-04-14T10:00:00Z', updatedAt: '2026-04-26T11:00:00Z' },

  // ===== Lotte JTB (c9) — Lost 사례 =====
  { id: 'op-012', channelId: 'c9', name: 'Lotte JTB 신규 통합 (취소)', type: 'NewIntegration', amount: 50_000_000, currency: 'JPY', closeDate: '2026-04-10', probability: 0, stage: 'Lost', ownerUserId: 'u-jasmine', sourceActivityIds: [], lostReason: 'Internal', decisionNote: 'OMH 내부 우선순위 재조정으로 SEA 권역 우선, 일본 신규 통합 보류 결정.', createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-04-10T16:00:00Z' },

  // ===== Expedia (c10) =====
  { id: 'op-013', channelId: 'c10', name: 'Expedia 연간 계약 갱신', type: 'Renewal', amount: 110_000_000, currency: 'JPY', closeDate: '2026-07-31', probability: 50, stage: 'NDA', ownerUserId: 'u-grace', sourceActivityIds: [], createdAt: '2026-04-12T13:00:00Z', updatedAt: '2026-04-25T10:00:00Z' },

  // ===== Ctrip Wholesale (c11) =====
  { id: 'op-014', channelId: 'c11', name: 'Ctrip Wholesale Q3 확장', type: 'Expansion', amount: 90_000_000, currency: 'JPY', closeDate: '2026-08-15', probability: 35, stage: 'Contact', ownerUserId: 'u-tm', sourceActivityIds: [], createdAt: '2026-04-23T09:00:00Z', updatedAt: '2026-04-26T08:00:00Z' },

  // ===== Tiket.com (c12) =====
  { id: 'op-015', channelId: 'c12', name: 'Tiket.com Indonesia 패키지', type: 'NewIntegration', amount: 30_000_000, currency: 'JPY', closeDate: '2026-05-31', probability: 65, stage: 'InDev', ownerUserId: 'u-jane', sourceActivityIds: [], createdAt: '2026-04-18T11:00:00Z', updatedAt: '2026-04-25T15:00:00Z' },
]

// FR-028 Forecast Categories 자동 분류 룰
export function categorizeForecast(probability: number): ForecastCategory {
  if (probability >= 90) return 'Commit'
  if (probability >= 70) return 'BestCase'
  if (probability >= 30) return 'Pipeline'
  return 'Omitted'
}

// Forecast 합계 계산 (BR-028-2)
export function forecastTotal(opportunities: Opportunity[], category: ForecastCategory) {
  const filtered = opportunities.filter(
    (o) => categorizeForecast(o.probability) === category && o.stage !== 'Won' && o.stage !== 'Lost'
  )
  if (category === 'Commit') {
    // ≥90%은 가중치 적용 안 함
    return filtered.reduce((sum, o) => sum + o.amount, 0)
  }
  // BestCase/Pipeline/Omitted = amount × probability/100
  return filtered.reduce((sum, o) => sum + o.amount * (o.probability / 100), 0)
}

// Win/Loss 통계 (FR-027)
export function winLossStats(opportunities: Opportunity[] = mockOpportunities) {
  const won = opportunities.filter((o) => o.stage === 'Won')
  const lost = opportunities.filter((o) => o.stage === 'Lost')
  const total = won.length + lost.length
  const winRate = total > 0 ? won.length / total : 0
  const lostByReason = lost.reduce((acc, o) => {
    const r = o.lostReason ?? 'Other'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  return { won: won.length, lost: lost.length, total, winRate, lostByReason }
}
