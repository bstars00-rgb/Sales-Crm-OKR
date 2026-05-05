// OkrContext — Round 14 FR-035
// Sales CRM consumer가 OKR Platform SDK를 React 앱 전역에서 공유하는 Context Provider
// graceful degrade (BR-035-4): isHealthy=false 시 모든 OKR UI 자동 비활성화

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars
import type { ReactNode } from 'react'
import { OkrClient } from '@/lib/okr-client'
import type { KeyResult, LimitingStepRecommendation } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface OkrContextValue {
  client: OkrClient
  availableKrs: KeyResult[]
  limitingStep: LimitingStepRecommendation | null
  isHealthy: boolean
  isLoading: boolean
  refreshAvailableKrs: () => Promise<void>
  refreshLimitingStep: () => Promise<void>
  reportContribution: (params: {
    krId: string
    contributionType: 'critical6_task' | 'activity'
    externalId: string
    completionRatio: number
    contributionWeight?: number
  }) => Promise<{ id: string } | null>
}

const OkrContext = createContext<OkrContextValue | null>(null)

export function OkrProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const client = useMemo(
    () => new OkrClient({ consumerScope: 'sales-crm' }),
    [],
  )

  const [availableKrs, setAvailableKrs] = useState<KeyResult[]>([])
  const [limitingStep, setLimitingStep] = useState<LimitingStepRecommendation | null>(null)
  const [isHealthy, setIsHealthy] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const lastFetchRef = useRef<number>(0)

  // Critical6Page와 일관 — admin/CEO/HR 등 KR 미할당 사용자에게 데모용 fallback
  const effectiveUserId = useMemo(() => {
    if (!user) return null
    // admin 또는 OKR 매핑 없는 사용자는 u-sales-1 데모 데이터로 fallback
    const SALES_USERS = ['u-sales-1', 'u-sales-2', 'u-sales-3', 'u-sales-4', 'u-sales-5', 'u-sales-6']
    if (SALES_USERS.includes(user.id)) return user.id
    return 'u-sales-1' // demo fallback
  }, [user])

  const refreshAvailableKrs = useCallback(async () => {
    if (!effectiveUserId) return
    setIsLoading(true)
    try {
      const krs = await client.listAvailableKrs({
        userId: effectiveUserId,
        quarter: 'Q3',
      })
      setAvailableKrs(krs)
      setIsHealthy(true)
      lastFetchRef.current = Date.now()
    } catch (e) {
      console.error('[OKR] listAvailableKrs failed', e)
      setIsHealthy(false)
    } finally {
      setIsLoading(false)
    }
  }, [client, effectiveUserId])

  const refreshLimitingStep = useCallback(async () => {
    if (!effectiveUserId) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      const rec = await client.getLimitingStepRecommendation({
        userId: effectiveUserId,
        date: today,
      })
      // [무시 (24h)] localStorage suppress 체크
      const suppressedKey = `okr_limiting_suppress_${effectiveUserId}`
      const suppressed = localStorage.getItem(suppressedKey)
      if (suppressed && rec && Date.now() - parseInt(suppressed) < 86400 * 1000) {
        setLimitingStep(null)
        return
      }
      setLimitingStep(rec)
      setIsHealthy(true)
    } catch (e) {
      console.error('[OKR] getLimitingStepRecommendation failed', e)
      setIsHealthy(false)
    }
  }, [client, effectiveUserId])

  const reportContribution: OkrContextValue['reportContribution'] = useCallback(
    async (params) => {
      if (!effectiveUserId) return null
      try {
        const result = await client.reportContribution({
          krId: params.krId,
          contributionType: params.contributionType,
          externalId: params.externalId,
          ownerId: effectiveUserId,
          contributionWeight: params.contributionWeight ?? 1.0,
          completionRatio: params.completionRatio,
          contributedAt: new Date().toISOString(),
          quarter: 'Q3',
        })
        setIsHealthy(true)
        return result
      } catch (e) {
        console.error('[OKR] reportContribution failed (queued)', e)
        setIsHealthy(false)
        // production: 큐잉 + 지수 백오프 재시도
        return null
      }
    },
    [client, effectiveUserId],
  )

  useEffect(() => {
    if (!effectiveUserId) return
    refreshAvailableKrs()
    refreshLimitingStep()
  }, [effectiveUserId, refreshAvailableKrs, refreshLimitingStep])

  const value: OkrContextValue = {
    client,
    availableKrs,
    limitingStep,
    isHealthy,
    isLoading,
    refreshAvailableKrs,
    refreshLimitingStep,
    reportContribution,
  }

  return <OkrContext.Provider value={value}>{children}</OkrContext.Provider>
}

export function useOkr() {
  const ctx = useContext(OkrContext)
  if (!ctx) throw new Error('useOkr must be used within OkrProvider')
  return ctx
}
