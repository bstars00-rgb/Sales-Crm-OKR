// OKR Platform mock data
// Round 14 OKR Platform 통합 — okr-platform-prd.md + okr-platform-implementation-plan.md 참조
// 본 mock은 Multi-tenant OKR 시스템을 sales-crm consumer 관점에서 시뮬레이션

import type {
  Objective,
  KeyResult,
  StrategicGoal,
  KrAlignment,
  KrContribution,
  LimitingStepRecommendation,
  QuarterRetroReport,
} from '@/types'

const NOW = '2026-08-15T09:00:00+09:00' // Q3 경과 50% 시점 (시연 기준)

// ============================================================================
// 1. Annual Objective (CEO 정의)
// ============================================================================

export const mockObjectives: Objective[] = [
  {
    id: 'obj-2026-annual',
    scope: 'company',
    ownerId: 'u-admin', // CEO
    title: '2026년 인바운드 일본 시장 점유율 25% 등극',
    description:
      'OMH의 2026년 최우선 비즈니스 목표 — 신규 채널 다변화 + Ctrip 의존도 축소 + TTV 안정 성장',
    year: 2026,
    status: 'active',
    progress: 0.42,
    consumerScope: ['sales-crm', 'scm-crm', 'marketing-platform'],
    version: 3,
    createdAt: '2026-01-05T10:00:00+09:00',
    updatedAt: '2026-08-15T03:00:00+09:00',
  },
  {
    id: 'obj-sales-2026',
    scope: 'division',
    ownerId: 'u-sales-dir',
    divisionId: 'div-sales',
    title: 'Sales 본부 2026 — 채널 다변화 + 매출 안정화',
    description: 'Sales 본부가 책임지는 연간 목표',
    year: 2026,
    status: 'active',
    progress: 0.55,
    parentObjectiveId: 'obj-2026-annual',
    consumerScope: ['sales-crm'],
    version: 2,
    createdAt: '2026-01-15T10:00:00+09:00',
    updatedAt: '2026-08-15T03:00:00+09:00',
  },
  {
    id: 'obj-scm-2026',
    scope: 'division',
    ownerId: 'u-admin',
    divisionId: 'div-scm',
    title: 'SCM 본부 2026 — 매입 capacity 확장 + 시즌성 정확도',
    description: 'SCM 본부가 책임지는 연간 목표',
    year: 2026,
    status: 'active',
    progress: 0.48,
    parentObjectiveId: 'obj-2026-annual',
    consumerScope: ['scm-crm'],
    version: 1,
    createdAt: '2026-01-15T10:00:00+09:00',
    updatedAt: '2026-08-15T03:00:00+09:00',
  },
  {
    id: 'obj-mktg-2026',
    scope: 'division',
    ownerId: 'u-admin',
    divisionId: 'div-marketing',
    title: 'Marketing 본부 2026 — 브랜드 인지도 + 디지털 노출',
    description: 'Marketing 본부가 책임지는 연간 목표',
    year: 2026,
    status: 'active',
    progress: 0.40,
    parentObjectiveId: 'obj-2026-annual',
    consumerScope: ['marketing-platform'],
    version: 1,
    createdAt: '2026-01-15T10:00:00+09:00',
    updatedAt: '2026-08-15T03:00:00+09:00',
  },
]

// ============================================================================
// 2. Quarterly Key Results
// ============================================================================

export const mockKeyResults: KeyResult[] = [
  // ---- Sales Q3 KRs ----
  {
    id: 'kr-s-1',
    objectiveId: 'obj-sales-2026',
    title: '신규 채널 5개 확보 (Trip.com / Booking.com / Agoda / 기타)',
    metric: 'count',
    baseline: 0,
    target: 5,
    current: 3,
    unit: '개',
    quarter: 'Q3',
    weight: 0.5,
    progress: 0.6,
    ownerId: 'u-sales-1',
    ownerScope: 'sales-crm',
    status: 'on_track',
    source: 'auto_critical6',
    visibility: 'team',
    alignedKrIds: ['kr-m-1'],
    lastAutoUpdate: '2026-08-14T23:01:00+09:00',
    staleSinceMinutes: 0,
    version: 5,
    createdAt: '2026-07-01T09:00:00+09:00',
  },
  {
    id: 'kr-s-2',
    objectiveId: 'obj-sales-2026',
    title: 'Q3 TTV ¥45억 달성',
    metric: 'currency',
    baseline: 3_500_000_000,
    target: 4_500_000_000,
    current: 2_025_000_000,
    unit: 'JPY',
    quarter: 'Q3',
    weight: 0.3,
    progress: 0.45,
    ownerId: 'u-sales-dir',
    ownerScope: 'sales-crm',
    status: 'at_risk',
    source: 'auto_kpi',
    linkedKpiSource: {
      consumerScope: 'sales-crm',
      kpiType: 'TTV',
      filter: { region: 'east_asia' },
    },
    visibility: 'division',
    lastAutoUpdate: '2026-08-15T03:01:00+09:00',
    staleSinceMinutes: 0,
    version: 8,
    createdAt: '2026-07-01T09:00:00+09:00',
  },
  {
    id: 'kr-s-3',
    objectiveId: 'obj-sales-2026',
    title: 'Ctrip 의존도 -10%P 감소 (35% → 25%)',
    metric: 'percent',
    baseline: 0.35,
    target: 0.25,
    current: 0.30,
    unit: '%',
    quarter: 'Q3',
    weight: 0.2,
    progress: 0.5,
    ownerId: 'u-sales-2',
    ownerScope: 'sales-crm',
    status: 'on_track',
    source: 'auto_kpi',
    linkedKpiSource: {
      consumerScope: 'sales-crm',
      kpiType: 'ChannelDependency',
      filter: { channelId: 'ch-ctrip' },
    },
    visibility: 'team',
    lastAutoUpdate: '2026-08-15T03:01:00+09:00',
    staleSinceMinutes: 0,
    version: 4,
    createdAt: '2026-07-01T09:00:00+09:00',
  },
  // ---- SCM Q3 KRs ----
  {
    id: 'kr-m-1',
    objectiveId: 'obj-scm-2026',
    title: '신규 채널 매입 capacity 50% 확장',
    metric: 'percent',
    baseline: 0,
    target: 0.5,
    current: 0.09,
    unit: '%',
    quarter: 'Q3',
    weight: 0.6,
    progress: 0.18,
    ownerId: 'u-admin',
    ownerScope: 'scm-crm',
    status: 'behind',
    source: 'manual',
    visibility: 'cross_team_pinned',
    alignedKrIds: ['kr-s-1'],
    version: 6,
    createdAt: '2026-07-01T09:00:00+09:00',
  },
  {
    id: 'kr-m-2',
    objectiveId: 'obj-scm-2026',
    title: '시즌성 가중치 정확도 95%',
    metric: 'percent',
    baseline: 0.78,
    target: 0.95,
    current: 0.91,
    unit: '%',
    quarter: 'Q3',
    weight: 0.4,
    progress: 0.78,
    ownerId: 'u-admin',
    ownerScope: 'scm-crm',
    status: 'on_track',
    source: 'auto_kpi',
    linkedKpiSource: {
      consumerScope: 'scm-crm',
      kpiType: 'SeasonalityAccuracy',
    },
    visibility: 'division',
    version: 3,
    createdAt: '2026-07-01T09:00:00+09:00',
  },
  // ---- Marketing Q3 KR ----
  {
    id: 'kr-mk-1',
    objectiveId: 'obj-mktg-2026',
    title: '주요 미디어 노출 50건',
    metric: 'count',
    baseline: 0,
    target: 50,
    current: 20,
    unit: '건',
    quarter: 'Q3',
    weight: 1.0,
    progress: 0.40,
    ownerId: 'u-admin',
    ownerScope: 'marketing-platform',
    status: 'at_risk',
    source: 'manual',
    visibility: 'company',
    version: 2,
    createdAt: '2026-07-01T09:00:00+09:00',
  },
  // ---- 신규 KR (historical 0건 fallback 시연용, TS-OKR-008) ----
  {
    id: 'kr-s-4',
    objectiveId: 'obj-sales-2026',
    title: 'B2B Travel Agent 파트너십 신규 3건',
    metric: 'count',
    baseline: 0,
    target: 3,
    current: 0,
    unit: '건',
    quarter: 'Q3',
    weight: 0,
    progress: null, // TS-OKR-001 데이터 없음 시연
    ownerId: 'u-sales-3',
    ownerScope: 'sales-crm',
    status: 'on_track',
    source: 'auto_critical6',
    visibility: 'team',
    version: 1,
    createdAt: '2026-08-12T09:00:00+09:00',
  },
]

// ============================================================================
// 3. Monthly Goals (옵션)
// ============================================================================

export const mockGoals: StrategicGoal[] = [
  {
    id: 'goal-aug-1',
    parentKrId: 'kr-s-1',
    month: '2026-08',
    title: '8월: Booking.com 미팅 + Trip.com 계약 검토',
    ownerId: 'u-sales-1',
    consumerScope: 'sales-crm',
    progress: 0.7,
    status: 'in_progress',
  },
  {
    id: 'goal-aug-2',
    parentKrId: 'kr-s-3',
    month: '2026-08',
    title: '8월: Ctrip 외 OTA 시장조사 + 신규 일본 OTA 미팅',
    ownerId: 'u-sales-2',
    consumerScope: 'sales-crm',
    progress: 0.5,
    status: 'in_progress',
  },
]

// ============================================================================
// 4. Cross-team Alignments
// ============================================================================

export const mockAlignments: KrAlignment[] = [
  {
    id: 'align-1',
    fromKrId: 'kr-s-1',
    toKrId: 'kr-m-1',
    type: 'depends_on',
    description:
      'Sales가 채널 확보하면 SCM이 매입 라인 셋업 — SCM의 매입 capacity가 부족하면 Sales 채널 확보가 매출로 연결되지 않음',
    createdBy: 'u-sales-dir',
    approvedBy: 'u-admin', // CEO 승인 (양 본부 Director 모두 승인 케이스)
    status: 'approved',
    createdAt: '2026-07-05T14:00:00+09:00',
  },
]

// ============================================================================
// 5. KR Contributions (Sales 베타 6명의 누적 매핑 — 50건)
// ============================================================================

export const mockContributions: KrContribution[] = [
  // u-sales-1 → kr-s-1 (Trip.com 미팅)
  {
    id: 'contrib-001',
    krId: 'kr-s-1',
    consumerScope: 'sales-crm',
    contributionType: 'critical6_task',
    externalId: 'task-101', // mocks/critical6.ts task-101
    ownerId: 'u-sales-1',
    contributionWeight: 0.4,
    completionRatio: 1.0,
    contributedAt: '2026-08-10T18:00:00+09:00',
    quarter: 'Q3',
  },
  {
    id: 'contrib-002',
    krId: 'kr-s-1',
    consumerScope: 'sales-crm',
    contributionType: 'critical6_task',
    externalId: 'task-102',
    ownerId: 'u-sales-1',
    contributionWeight: 0.3,
    completionRatio: 0.5,
    contributedAt: '2026-08-12T15:00:00+09:00',
    quarter: 'Q3',
  },
  {
    id: 'contrib-003',
    krId: 'kr-s-1',
    consumerScope: 'sales-crm',
    contributionType: 'activity',
    externalId: 'opp-501', // Opportunity Won
    ownerId: 'u-sales-1',
    contributionWeight: 0.3,
    completionRatio: 1.0,
    contributedAt: '2026-08-08T11:00:00+09:00',
    quarter: 'Q3',
  },
  // u-sales-2 → kr-s-3
  {
    id: 'contrib-010',
    krId: 'kr-s-3',
    consumerScope: 'sales-crm',
    contributionType: 'critical6_task',
    externalId: 'task-201',
    ownerId: 'u-sales-2',
    contributionWeight: 0.5,
    completionRatio: 0.5,
    contributedAt: '2026-08-13T14:00:00+09:00',
    quarter: 'Q3',
  },
  {
    id: 'contrib-011',
    krId: 'kr-s-3',
    consumerScope: 'sales-crm',
    contributionType: 'kpi_value',
    externalId: 'kpi-channel-dep-2026-08-15',
    ownerId: 'system',
    contributionWeight: 0.5,
    completionRatio: 1.0,
    contributedAt: '2026-08-15T03:01:00+09:00',
    quarter: 'Q3',
  },
  // u-sales-3 → kr-s-4 (신규 KR — 1건만)
  {
    id: 'contrib-020',
    krId: 'kr-s-4',
    consumerScope: 'sales-crm',
    contributionType: 'critical6_task',
    externalId: 'task-301',
    ownerId: 'u-sales-3',
    contributionWeight: 1.0,
    completionRatio: 0,
    contributedAt: '2026-08-13T10:00:00+09:00',
    quarter: 'Q3',
  },
  // u-sales-4 → kr-s-1
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `contrib-04${i.toString().padStart(2, '0')}`,
    krId: 'kr-s-1',
    consumerScope: 'sales-crm' as const,
    contributionType: 'critical6_task' as const,
    externalId: `task-4${i.toString().padStart(2, '0')}`,
    ownerId: 'u-sales-4',
    contributionWeight: 0.125,
    completionRatio: i < 4 ? 1.0 : i < 6 ? 0.5 : 0,
    contributedAt: `2026-08-${(8 + i).toString().padStart(2, '0')}T10:00:00+09:00`,
    quarter: 'Q3' as const,
  })),
  // u-sales-5/6 mixed
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `contrib-05${i.toString().padStart(2, '0')}`,
    krId: i % 2 === 0 ? 'kr-s-1' : 'kr-s-2',
    consumerScope: 'sales-crm' as const,
    contributionType: 'critical6_task' as const,
    externalId: `task-5${i.toString().padStart(2, '0')}`,
    ownerId: i % 3 === 0 ? 'u-sales-5' : 'u-sales-6',
    contributionWeight: 0.1,
    completionRatio: Math.random() > 0.5 ? 1.0 : 0.5,
    contributedAt: `2026-08-${(5 + i).toString().padStart(2, '0')}T10:00:00+09:00`,
    quarter: 'Q3' as const,
  })),
]

// ============================================================================
// 6. Limiting Step (오늘의 추천) — Round 15 다양화
// ============================================================================
//
// AI 없이 알고리즘으로 동적 생성:
// 1. KR_RECOMMENDATION_POOL — KR마다 historical task 패턴 기반 12~15개 templates
// 2. USER_LIMITING_KR — 사용자별 가장 뒤쳐진 KR 매핑 (실제 production은 BR-OKR-002 알고리즘)
// 3. getRecommendationForUser() — 매 호출 시 pool에서 random 3건 pick (방법 A 패턴 + 방법 B historical 결합)

// KR별 추천 task pool (방법 A 카테고리 패턴 + 방법 B historical title 재사용)
export const KR_RECOMMENDATION_POOL: Record<string, string[]> = {
  // KR-S-1 신규 채널 5개 확보 — count metric, NewDeal 카테고리 빈도 높음
  'kr-s-1': [
    'Booking.com 신규 채널 미팅 follow-up',
    'Trip.com 계약 조건 협의',
    'Agoda 통합 NDA 검토',
    'Yanolja 일본 진출 미팅',
    'MakeMyTrip 인도 시장 진출 검토',
    'Klook 동남아 통합 가능성 타진',
    '신규 OTA 후보 리스트 정리 (3개)',
    '채널 우선순위 ranking 업데이트',
    'Trip.com 결제 시스템 연동 검토',
    'Booking.com 견적 제안서 발송',
    'Wing On Travel 계약 검토 회의',
    'Rakuten Travel B2B 통합 미팅',
    '경쟁사 채널 다변화 전략 분석',
    'Director 보고용 신규 채널 pipeline 정리',
  ],
  // KR-S-2 Q3 TTV ¥45억 — currency metric, Pipeline/Contract 카테고리
  'kr-s-2': [
    'Q3 마감 임박 거래 점검 (≥¥1억 거래 5건)',
    '대형 채널 견적 발송 — Trip.com / Booking.com',
    '월말 클로징 follow-up — 8월 마감 거래',
    '8월 마감 임박 거래 가격 재협상',
    '결제 조건 finalize — 30일 → 45일 검토',
    'Won 후보 거래 클로징 가속화 미팅',
    'Q3 판매팀 KPI 진척률 점검',
    '월별 TTV target 분해 (¥15억/월)',
    '주간 매출 보고서 작성 + Director 공유',
    '대형 거래 결제 일정 확인',
    'Director 면담 — 클로징 위험 거래 보고',
    'Pipeline Stage Won 전환 회의',
    'Forecast Category Commit/BestCase 재분류',
    '환율 영향 시뮬레이션 (JPY/USD/CNY)',
  ],
  // KR-S-3 Ctrip 의존도 -10%P — percent metric, NewDeal/Follow-up 카테고리
  'kr-s-3': [
    'Booking.com 신규 채널 확보 미팅',
    'Trip.com 계약 검토 follow-up',
    'Ctrip 외 신규 일본 OTA 시장조사',
    'Yanolja 일본 진출 미팅',
    'Agoda 일본 시장 비중 확대 협의',
    '국내 OTA 비교 분석 보고서',
    'Ctrip 의존도 월별 추이 분석',
    '대안 채널 partnership 제안',
    'Booking.com vs 일본 OTA 비교 검토',
    '일본 OTA 점유율 시장조사',
    '한국 OTA 일본 진출 가능성 검토',
    'Ctrip 의존도 분기 대시보드 점검',
    '동남아 OTA로 다변화 전략 수립',
    '경쟁사 의존도 비교 분석 (Ctrip/Booking/Agoda)',
  ],
  // KR-S-4 B2B Travel Agent 신규 3건 — historical 0건 fallback
  'kr-s-4': [
    'KR-S-4 관련 미팅 예약',
    'B2B Travel Agent 담당자 연락',
    'KR-S-4 달성 계획 수립',
    'B2B partnership 후보 리스트 정리',
    '경쟁사 B2B 전략 분석',
    'B2B 채널 발굴 시장조사',
    'B2B 계약 표준 template 작성',
    'Travel Agent 협회 참석 미팅 예약',
  ],
  // KR-M-1 SCM 매입 capacity 50% — Cross-team alignment 시연용
  'kr-m-1': [
    'SCM 매입 capacity 확장 회의',
    '신규 채널 매입 line setup 검토',
    'SCM Director 1:1 alignment 미팅',
    '시즌성 가중치 v2 검토',
    '매입 단가 재협상 (Tier 1 호텔)',
  ],
  // KR-MK-1 Marketing 미디어 노출 — Cross-team
  'kr-mk-1': [
    'Tier 1 미디어 partnership 제안',
    '홍보 자료 영문/일문 번역 검토',
    '미디어 프레스킷 업데이트',
    '주요 미디어 인터뷰 요청',
    '브랜드 가이드 v2 작성',
  ],
}

// 사용자별 가장 뒤쳐진 KR 매핑 (실제 production은 BR-OKR-002 알고리즘으로 자동 식별)
// 6명의 sales user가 각각 다른 KR 영역에서 압박받는 다양한 시연 시나리오
export const USER_LIMITING_KR: Record<string, { krId: string; isFallback?: boolean } | null> = {
  'u-sales-1': { krId: 'kr-s-3' },                    // Ctrip 의존도 5% 지연
  'u-sales-2': { krId: 'kr-s-1' },                    // 신규 채널 5개 — 다른 각도
  'u-sales-3': { krId: 'kr-s-4', isFallback: true },  // 신규 KR — historical 0건 fallback
  'u-sales-4': { krId: 'kr-s-2' },                    // TTV currency 부담
  'u-sales-5': { krId: 'kr-s-3' },                    // Ctrip 의존도 — 다른 사용자 다른 추천
  'u-sales-6': { krId: 'kr-s-1' },                    // 신규 채널 — 다른 각도
  'u-admin': null, // OKR 미할당 — 정상
}

// Fisher-Yates shuffle (편향 없는 random)
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * 동적 추천 생성 — AI 없이 알고리즘 기반.
 * 매 호출 시 KR_RECOMMENDATION_POOL에서 random 3건 pick (방법 A + B 결합)
 * production은 BR-OKR-002 알고리즘 (카테고리 빈도 + historical title 재사용)
 */
export function getRecommendationForUser(userId: string): LimitingStepRecommendation | null {
  const limiting = USER_LIMITING_KR[userId]
  if (!limiting) return null
  const kr = mockKeyResults.find((k) => k.id === limiting.krId)
  if (!kr) return null

  const pool = KR_RECOMMENDATION_POOL[limiting.krId] ?? []
  if (pool.length === 0) return null

  // pool에서 random 3건 (또는 pool 크기보다 작으면 그만큼)
  const recommended = shuffle(pool).slice(0, Math.min(3, pool.length))

  const expectedProgress = limiting.isFallback ? 0.10 : 0.55 // Q3 50% 경과 (신규 KR은 낮은 기대치)
  const krProgress = kr.progress ?? 0
  const delayPercent = Math.max(0, Math.round((expectedProgress - krProgress) * 100))

  return {
    krId: kr.id,
    title: kr.title,
    progress: krProgress,
    expectedProgress,
    delay: `${delayPercent}%`,
    recommendedTasks: recommended,
    isFallback: !!limiting.isFallback,
    reason: limiting.isFallback ? '신규 KR이라 추천 패턴 부족 — 일반 권장 문구 표시' : undefined,
  }
}

// Backward compatibility — 정적 맵 (legacy 호출용)
// Production: getRecommendationForUser() 동적 호출 권장 (매번 다른 추천)
export const mockLimitingStepRecommendations: Record<string, LimitingStepRecommendation | null> = {
  'u-sales-1': getRecommendationForUser('u-sales-1'),
  'u-sales-2': getRecommendationForUser('u-sales-2'),
  'u-sales-3': getRecommendationForUser('u-sales-3'),
  'u-sales-4': getRecommendationForUser('u-sales-4'),
  'u-sales-5': getRecommendationForUser('u-sales-5'),
  'u-sales-6': getRecommendationForUser('u-sales-6'),
  'u-admin': null,
}

// ============================================================================
// 7. Quarter Retro Report (Q3 분기 회고 — 자동 생성된 mock)
// ============================================================================

export const mockQ3RetroReport: QuarterRetroReport = {
  quarter: 'Q3',
  year: 2026,
  scope: 'team',
  generatedAt: '2026-09-30T23:00:00+09:00',
  krResults: [
    {
      krId: 'kr-s-1',
      title: '신규 채널 5개 확보',
      finalProgress: 0.80, // 4/5
      status: 'achieved',
      note: 'Stretch 달성 (Grove 0.7 임계 통과)',
    },
    {
      krId: 'kr-s-2',
      title: 'Q3 TTV ¥45억',
      finalProgress: 0.93, // ¥42억/45억
      status: 'achieved',
      note: 'KPI source 자동 측정 — 7% 미달이지만 stretch 정의 기준 통과',
    },
    {
      krId: 'kr-s-3',
      title: 'Ctrip 의존도 -10%P 감소',
      finalProgress: 1.30, // -13%P 실제 vs -10%P 목표 → 130% (clamp 1.0)
      status: 'achieved',
      note: '초과 달성 — TS-OKR-012 음수 성장률 클램핑 적용',
    },
  ],
  limitingStepCount: 18,
  topLimitingKrs: [
    { krId: 'kr-s-2', title: 'Q3 TTV ¥45억', count: 12 },
    { krId: 'kr-mk-1', title: 'Marketing 미디어 노출 50건', count: 4 },
    { krId: 'kr-m-1', title: 'SCM 매입 capacity 50%', count: 2 },
  ],
  mappingRate: 0.52,
  mappingRateImprovement: 0.12,
  alignments: [
    {
      fromKrId: 'kr-s-1',
      toKrId: 'kr-m-1',
      type: 'depends_on',
      effectiveness: 'mixed',
      note:
        'SCM 18% 진척으로 Sales 60% 진척의 50%만 매출 전환 (추정) — 다음 분기 SCM 매입 KR을 분기 시작 시점으로 frontload 권장',
    },
  ],
  recommendations: [
    'KR-M-1 (SCM 매입 capacity)이 회사 전체 Limiting Step — Q4 시작 시점에 SCM Director가 매입 KR을 frontload 하도록 OKR 정의',
    '미연결 비율 25% (양호 범위) → 강제 정책 적용 보류',
    'Marketing KR-MK-1 노출 건수 미달 → 대형 미디어 partnership 1건 우선 확보 필요',
    'KR-S-3 stretch 130% 달성 — Q4 KR 정의 시 더 높은 target 설정 검토',
  ],
}

// ============================================================================
// 8. Helper Functions (mock OkrClient에서 사용)
// ============================================================================

export function getActiveKrsByUser(userId: string): KeyResult[] {
  return mockKeyResults.filter(
    (kr) =>
      kr.ownerId === userId ||
      // 본인 팀 KR (간이 — 실제는 user.teamId 기반)
      mockContributions.some(
        (c) => c.krId === kr.id && c.ownerId === userId,
      ),
  )
}

export function getAvailableKrsForDropdown(_userId: string): KeyResult[] {
  // 본인 + 본인 팀 + alignment 승인된 cross-team KR
  // 시연용으로는 visibility != 'private' 모두 노출
  return mockKeyResults.filter(
    (kr) => kr.visibility !== 'private' && kr.quarter === 'Q3',
  )
}

export function getKrById(krId: string): KeyResult | undefined {
  return mockKeyResults.find((kr) => kr.id === krId)
}

export function getObjectiveById(objId: string): Objective | undefined {
  return mockObjectives.find((o) => o.id === objId)
}

export function getKrsByObjective(objId: string): KeyResult[] {
  return mockKeyResults.filter((kr) => kr.objectiveId === objId)
}

export function getContributionsByKr(krId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q3'): KrContribution[] {
  return mockContributions.filter((c) => c.krId === krId && c.quarter === quarter)
}

export function getAlignmentsByKr(krId: string): KrAlignment[] {
  return mockAlignments.filter(
    (a) => a.fromKrId === krId || a.toKrId === krId,
  )
}

/**
 * BR-OKR-001 — KR 진척률 자동 집계 공식 (mock 구현)
 * TS-OKR-001 division by zero 방어 + TS-OKR-005 부동소수점 안전
 */
export function calculateKrProgress(krId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q3'): number | null {
  const contribs = getContributionsByKr(krId, quarter)
  if (contribs.length === 0) return null // TS-OKR-001 division by zero 방어

  const denominator = contribs.reduce((sum, c) => sum + c.contributionWeight, 0)
  if (denominator < 1e-9) return null // TS-OKR-005 부동소수점 안전

  const numerator = contribs.reduce(
    (sum, c) => sum + c.contributionWeight * c.completionRatio,
    0,
  )
  return Math.max(0, Math.min(1, numerator / denominator)) // TS-OKR-012 음수 성장률 클램핑
}

/**
 * 미연결 비율 (BR-OKR-003) — 본인 분기 누적 task 기준
 */
export function calculateUnlinkedRate(
  userId: string,
  totalTasks: number,
  linkedTasks: number,
): { rate: number; tier: 'normal' | 'self_alert' | 'manager_alert' | 'admin_alert' } {
  if (totalTasks === 0) return { rate: 0, tier: 'normal' }
  const rate = (totalTasks - linkedTasks) / totalTasks
  let tier: 'normal' | 'self_alert' | 'manager_alert' | 'admin_alert' = 'normal'
  if (rate >= 0.81) tier = 'admin_alert'
  else if (rate >= 0.61) tier = 'manager_alert'
  else if (rate >= 0.31) tier = 'self_alert'
  void userId // 시연용 (실제는 user.hireDate 기반 면제 로직 추가)
  return { rate, tier }
}

export const TODAY = NOW
