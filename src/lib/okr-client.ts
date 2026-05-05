// Mock OkrClient — Round 14 OKR Platform Consumer SDK 시뮬레이션
//
// Production: '@omh/okr-sdk' npm package import 후 OkrClient 인스턴스 생성.
//             실제 OKR Platform과 HTTPS REST API + JWT 통신.
// Prototype: 본 파일이 mock 구현 — mocks/okr.ts 데이터를 in-memory로 응답.
//
// 모든 API는 Promise 기반 — graceful degrade (5xx 응답 실패 시 reject) 시연 위해 latency 추가.

import type {
  KeyResult,
  KrContribution,
  LimitingStepRecommendation,
  Objective,
  StrategicGoal,
  OkrTreeNode,
  Quarter,
  ConsumerScope,
} from '@/types'
import {
  getAvailableKrsForDropdown,
  getKrById,
  getObjectiveById,
  getKrsByObjective,
  getContributionsByKr,
  getAlignmentsByKr,
  calculateKrProgress,
  mockObjectives,
  mockKeyResults,
  mockContributions,
  mockLimitingStepRecommendations,
  mockQ3RetroReport,
  mockGoals,
} from '@/mocks/okr'

// ============================================================================
// Mock 응답 latency (시연용 — 실제 SDK는 200~500ms p95)
// ============================================================================
const NETWORK_LATENCY_MS = 80
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 시연용 — 5xx 시뮬레이션 토글 (graceful degrade 검증)
let SIMULATE_OUTAGE = false
export function setOkrPlatformOutage(on: boolean) {
  SIMULATE_OUTAGE = on
}

// ============================================================================
// Reuqest types
// ============================================================================
export interface ListAvailableKrsParams {
  userId: string
  quarter: Quarter
}

export interface ReportContributionParams {
  krId: string
  contributionType: 'critical6_task' | 'activity' | 'kpi_value' | 'manual_update'
  externalId: string
  ownerId: string
  contributionWeight: number
  completionRatio: number
  contributedAt: string
  quarter: Quarter
}

export interface ReportKpiValueParams {
  kpiType: string
  value: number
  asOf: string
  consumerScope: ConsumerScope
  filter?: Record<string, unknown>
}

export interface GetLimitingStepParams {
  userId: string
  date: string
}

// ============================================================================
// In-memory write store (mock — Production은 OKR Platform DB)
// ============================================================================
const writtenContributions: KrContribution[] = []

// ============================================================================
// OkrClient class (mock 구현)
// ============================================================================
export class OkrClient {
  consumerScope: ConsumerScope
  apiUrl: string

  constructor(opts: { consumerScope: ConsumerScope; apiUrl?: string }) {
    this.consumerScope = opts.consumerScope
    this.apiUrl = opts.apiUrl ?? 'https://okr.omh.internal'
  }

  // --------------------------------------------------------------------------
  // Read
  // --------------------------------------------------------------------------

  async listAvailableKrs(params: ListAvailableKrsParams): Promise<KeyResult[]> {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    void params.quarter // mock은 Q3 한정
    return getAvailableKrsForDropdown(params.userId)
  }

  async getKeyResult(krId: string): Promise<KeyResult | null> {
    await sleep(NETWORK_LATENCY_MS / 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    return getKrById(krId) ?? null
  }

  async getObjective(objectiveId: string): Promise<Objective | null> {
    await sleep(NETWORK_LATENCY_MS / 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    return getObjectiveById(objectiveId) ?? null
  }

  async getLimitingStepRecommendation(
    params: GetLimitingStepParams,
  ): Promise<LimitingStepRecommendation | null> {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    void params.date
    return mockLimitingStepRecommendations[params.userId] ?? null
  }

  // 본인 OKR Tree
  async getMyOkrTree(userId: string, year: number): Promise<OkrTreeNode> {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    void userId
    return this.buildOkrTree(year, 'company')
  }

  async getTeamOkrTree(_teamId: string, year: number): Promise<OkrTreeNode> {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    return this.buildOkrTree(year, 'division')
  }

  async getCompanyOkrTree(year: number): Promise<OkrTreeNode> {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    return this.buildOkrTree(year, 'company')
  }

  private buildOkrTree(year: number, _scope: 'company' | 'division'): OkrTreeNode {
    const annual = mockObjectives.find(
      (o) => o.scope === 'company' && o.year === year,
    )
    if (!annual) {
      return {
        type: 'objective',
        id: 'empty',
        title: '데이터 없음',
        progress: null,
        status: 'draft',
        ownerId: '',
        children: [],
      }
    }
    const divisionObjs = mockObjectives.filter(
      (o) => o.parentObjectiveId === annual.id,
    )
    return {
      type: 'objective',
      id: annual.id,
      title: annual.title,
      progress: annual.progress,
      status: annual.status,
      ownerId: annual.ownerId,
      children: divisionObjs.map((divObj) => ({
        type: 'objective',
        id: divObj.id,
        title: divObj.title,
        progress: divObj.progress,
        status: divObj.status,
        ownerId: divObj.ownerId,
        children: getKrsByObjective(divObj.id).map((kr) => ({
          type: 'keyresult',
          id: kr.id,
          title: kr.title,
          progress: kr.progress,
          status: kr.status,
          ownerId: kr.ownerId,
          weight: kr.weight,
          alignedTo: getAlignmentsByKr(kr.id).map((a) => {
            const otherKrId = a.fromKrId === kr.id ? a.toKrId : a.fromKrId
            const otherKr = getKrById(otherKrId)
            return {
              krId: otherKrId,
              krTitle: otherKr?.title ?? '(unknown)',
              type: a.type,
            }
          }),
          contributingTaskIds: getContributionsByKr(kr.id)
            .filter((c) => c.contributionType === 'critical6_task')
            .map((c) => c.externalId),
        })),
      })),
    }
  }

  // 분기 회고 리포트
  async getQuarterRetro(quarter: Quarter, year: number) {
    await sleep(NETWORK_LATENCY_MS * 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    if (quarter === 'Q3' && year === 2026) return mockQ3RetroReport
    return null
  }

  // Bottleneck Chart 데이터 (KR + alignment + Limiting Step 강조)
  async getBottleneckData(year: number, quarter: Quarter) {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    const krs = mockKeyResults.filter((kr) => kr.quarter === quarter)
    return {
      year,
      quarter,
      krs: krs.map((kr) => ({
        ...kr,
        objective: getObjectiveById(kr.objectiveId),
      })),
      limitingKrId: 'kr-m-1', // 가장 뒤쳐진 KR (회사 전체 Limiting Step)
      alignments: [{ fromKrId: 'kr-s-1', toKrId: 'kr-m-1', type: 'depends_on' as const }],
    }
  }

  // 매핑된 Critical 6 task 목록 (drill-down용)
  async getMappedTasks(krId: string, quarter: Quarter = 'Q3') {
    await sleep(NETWORK_LATENCY_MS / 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    return getContributionsByKr(krId, quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4').filter(
      (c) => c.contributionType === 'critical6_task',
    )
  }

  // Goals
  async getGoalsByKr(krId: string): Promise<StrategicGoal[]> {
    await sleep(NETWORK_LATENCY_MS / 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    return mockGoals.filter((g) => g.parentKrId === krId)
  }

  // --------------------------------------------------------------------------
  // Write
  // --------------------------------------------------------------------------

  async reportContribution(params: ReportContributionParams): Promise<{ id: string }> {
    await sleep(NETWORK_LATENCY_MS / 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    // TS-OKR-006 권한 검증 (mock — 실제는 OKR Platform 서버 사이드)
    const kr = getKrById(params.krId)
    if (!kr) throw new Error('kr_not_accessible')
    // unique constraint 검증 — (krId, externalId, quarter)
    const dup = [...mockContributions, ...writtenContributions].find(
      (c) =>
        c.krId === params.krId &&
        c.externalId === params.externalId &&
        c.quarter === params.quarter,
    )
    if (dup) {
      // upsert: completionRatio 갱신
      dup.completionRatio = params.completionRatio
      return { id: dup.id }
    }
    const id = `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    writtenContributions.push({
      id,
      ...params,
      consumerScope: this.consumerScope,
    })
    return { id }
  }

  async deleteContribution(contributionId: string): Promise<void> {
    await sleep(NETWORK_LATENCY_MS / 2)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    const idx = writtenContributions.findIndex((c) => c.id === contributionId)
    if (idx >= 0) writtenContributions.splice(idx, 1)
  }

  async reportKpiValue(params: ReportKpiValueParams): Promise<{ accepted: boolean }> {
    await sleep(NETWORK_LATENCY_MS)
    if (SIMULATE_OUTAGE) throw new Error('OKR_PLATFORM_5XX')
    void params
    // mock: 항상 수락
    return { accepted: true }
  }

  // --------------------------------------------------------------------------
  // Health
  // --------------------------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    await sleep(50)
    return !SIMULATE_OUTAGE
  }
}

// 헬퍼: in-memory contribution 데이터 (mock 시연용)
export function getAllContributions(): KrContribution[] {
  return [...mockContributions, ...writtenContributions]
}

// BR-OKR-001 자동 집계 — write 후 KR.progress 재계산 (mock — production은 OKR Platform 서버)
export function recalculateKrProgressLocal(krId: string): number | null {
  const allContribs = getAllContributions()
  const filtered = allContribs.filter((c) => c.krId === krId && c.quarter === 'Q3')
  if (filtered.length === 0) return null
  const denom = filtered.reduce((s, c) => s + c.contributionWeight, 0)
  if (denom < 1e-9) return null
  const num = filtered.reduce((s, c) => s + c.contributionWeight * c.completionRatio, 0)
  return Math.max(0, Math.min(1, num / denom))
}

// re-export for convenience
export { calculateKrProgress }
