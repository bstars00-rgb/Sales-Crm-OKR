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
// 6. Limiting Step (오늘의 추천)
// ============================================================================

export const mockLimitingStepRecommendations: Record<string, LimitingStepRecommendation | null> = {
  'u-sales-1': {
    krId: 'kr-s-3',
    title: 'Ctrip 의존도 -10%P 감소',
    progress: 0.50,
    expectedProgress: 0.55, // Q3 경과 50% 기준
    delay: '5%',
    recommendedTasks: [
      'Booking.com 신규 채널 미팅 follow-up',
      'Trip.com 계약 검토 follow-up',
      'Ctrip 외 신규 일본 OTA 시장조사',
    ],
    isFallback: false,
  },
  'u-sales-2': {
    krId: 'kr-s-3',
    title: 'Ctrip 의존도 -10%P 감소',
    progress: 0.50,
    expectedProgress: 0.55,
    delay: '5%',
    recommendedTasks: [
      'Ctrip 외 신규 일본 OTA 시장조사',
      'Yanolja 일본 진출 미팅',
      '국내 OTA 비교 분석',
    ],
    isFallback: false,
  },
  'u-sales-3': {
    krId: 'kr-s-4',
    title: 'B2B Travel Agent 파트너십 신규 3건',
    progress: 0,
    expectedProgress: 0.10, // 신규 KR이라 기대치 낮음
    delay: '10%',
    recommendedTasks: [
      'KR-S-4 관련 미팅 예약',
      'B2B Travel Agent 담당자 연락',
      'KR-S-4 달성 계획 수립',
    ],
    isFallback: true, // historical 0건
    reason: '신규 KR이라 추천 패턴 부족 — 일반 권장 문구 표시',
  },
  'u-sales-4': null, // 활성 KR이 모두 정상 — 배너 미표시
  'u-sales-5': {
    krId: 'kr-s-2',
    title: 'Q3 TTV ¥45억 달성',
    progress: 0.45,
    expectedProgress: 0.55,
    delay: '10%',
    recommendedTasks: [
      'Q2 Won 기회의 후속 미팅',
      '대형 채널 견적 발송',
      '계약 클로징 follow-up',
    ],
    isFallback: false,
  },
  'u-sales-6': {
    krId: 'kr-s-2',
    title: 'Q3 TTV ¥45억 달성',
    progress: 0.45,
    expectedProgress: 0.55,
    delay: '10%',
    recommendedTasks: [
      '8월 마감 임박 거래 점검',
      '대형 거래 견적 송부',
      '월말 클로징 회의 준비',
    ],
    isFallback: false,
  },
  // admin/CEO 등 KR 미할당자
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
