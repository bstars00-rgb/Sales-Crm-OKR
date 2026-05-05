import type { DecisionRequest } from '@/types'

// FR-014: Manager 의사결정 요청 + Director/CEO 승인
export const mockDecisions: DecisionRequest[] = [
  {
    id: 'dr-001',
    weeklyBriefId: 'wb-2026-w16',
    requestedByUserId: 'u-tm',
    category: 'Pricing',
    title: 'Trip.com Group Q3 단가 인하 승인 요청',
    detail: 'Trip.com Group이 Q3 분기 ADR 5% 인하를 요청. 인접 거래처(Agoda, Booking) 평균 ADR 대비 8% 비싸 경쟁력 우려. 인하 시 RN +12% 예상.',
    options: ['5% 인하 승인', '3% 인하 (절충)', '인하 거부 + 부가 패키지 제안'],
    decisionByRole: 'director',
    status: 'Open',
    createdAt: '2026-04-22T09:00:00Z',
  },
  {
    id: 'dr-002',
    weeklyBriefId: 'wb-2026-w16',
    requestedByUserId: 'u-grace',
    category: 'Contract',
    title: 'HanaTour Japan SG-Flip 일정 1개월 연장',
    detail: '거래처 내부 법무 검토가 길어져 5/30 마감을 6/30으로 1개월 연장 요청. 동기간 매출 예상 ¥120M 영향.',
    options: ['1개월 연장 승인', '연장 거부 → 기존 일정 유지', '2주만 연장 (5/30 → 6/13)'],
    decisionByRole: 'director',
    status: 'UnderReview',
    createdAt: '2026-04-23T14:30:00Z',
  },
  {
    id: 'dr-003',
    weeklyBriefId: 'wb-2026-w16',
    requestedByUserId: 'u-tmgr',
    category: 'Resource',
    title: 'SEA 권역 신규 PIC 1명 충원',
    detail: 'SEA 권역 채널 수 38개 → 51개로 증가, 1인당 부담 채널 17개 초과. 7월 입사 기준 1명 충원 검토.',
    options: ['7월 입사 1명 승인', 'Q3 말 채용 (10월)', '기존 인력 효율화 유지'],
    decisionByRole: 'ceo',
    status: 'Open',
    createdAt: '2026-04-24T11:00:00Z',
  },
  {
    id: 'dr-004',
    weeklyBriefId: 'wb-2026-w15',
    requestedByUserId: 'u-pm',
    category: 'Strategy',
    title: 'Ctrip 의존도 35% 초과 — 대체 채널 발굴 우선순위',
    detail: 'Ctrip TTV% 4월 기준 38.2% → 목표 35% 초과. Top3 Non-Ctrip 채널 전략적 강화 vs 신규 채널 발굴 둘 중 우선순위 결정 필요.',
    options: ['Top3 Non-Ctrip 강화 (Trip.com / Agoda / Booking)', '신규 SEA 채널 5개 발굴 우선', '병행 진행'],
    decisionByRole: 'ceo',
    status: 'Decided',
    decidedAt: '2026-04-21T16:00:00Z',
    decision: '병행 진행',
    decisionNote: '병행하되 Top3 강화 60% / 신규 발굴 40% 리소스 배분',
    createdAt: '2026-04-19T09:00:00Z',
  },
  {
    id: 'dr-005',
    weeklyBriefId: 'wb-2026-w15',
    requestedByUserId: 'u-jane',
    category: 'Pricing',
    title: 'Yanolja Cloud 신용 한도 ¥80M → ¥120M 증액',
    detail: '신용 한도 사용률 92% 도달, 추가 매출 기회 차단 우려. 매출 추이 안정적 (WoW +8%).',
    options: ['¥120M 승인', '¥100M (단계적)', '거부 — 결제 주기 단축 (Net30→Net15)'],
    decisionByRole: 'director',
    status: 'Decided',
    decidedAt: '2026-04-20T10:00:00Z',
    decision: '¥100M (단계적)',
    decisionNote: '단계적 증액 후 3개월 결제 이력 확인하고 ¥120M 재검토',
    createdAt: '2026-04-18T13:00:00Z',
  },
  {
    id: 'dr-006',
    weeklyBriefId: 'wb-2026-w14',
    requestedByUserId: 'u-jasmine',
    category: 'Contract',
    title: 'Tiket.com 신용 한도 초과 — 거래 일시 정지 여부',
    detail: '신용 한도 사용률 98% 도달, 미결제 ¥35M. 거래 정지 시 월 매출 ¥250M 손실 예상.',
    options: ['일시 정지 후 결제 독촉', '한도 임시 ¥10M 증액 (1주)', 'Citi Bank 보증 요구'],
    decisionByRole: 'director',
    status: 'Deferred',
    createdAt: '2026-04-15T09:30:00Z',
  },
]

export function decisionStats(items: DecisionRequest[] = mockDecisions) {
  const total = items.length
  const open = items.filter((d) => d.status === 'Open').length
  const underReview = items.filter((d) => d.status === 'UnderReview').length
  const decided = items.filter((d) => d.status === 'Decided').length
  const deferred = items.filter((d) => d.status === 'Deferred').length
  return { total, open, underReview, decided, deferred }
}
