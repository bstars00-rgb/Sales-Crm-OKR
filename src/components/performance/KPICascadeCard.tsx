import { useEffect, useState } from 'react'
import { ChevronRight, Target, Building, Globe2, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/kpiCalc'
import { loadReport, LATEST_WEEK, type RealReport } from '@/services/reportData'

/**
 * FR-008 KPI Cascade L1~L5 시각화 placeholder.
 * 정식 편집 UI는 Phase 1.5 (Director 권한 + audit log + SCM 연동).
 * 현 단계는 5단계 구조 + 시뮬레이션 가중치(Tier 50/30/20)를 시각적으로 표현.
 */

const buildCascadeLevels = (currentMonth: number, seasonality: number) => [
  { level: 'L1', name: '전사 연간', icon: Target, editorRole: 'CEO / C-Level', value: '¥30B', sub: 'TTV 목표 (시뮬)' },
  { level: 'L2', name: '권역', icon: Globe2, editorRole: 'Regional Director', value: 'EA 50% / SEA 25% / SA 15%', sub: 'EA: ¥15B' },
  { level: 'L3', name: '채널 (Tier 가중치)', icon: Building, editorRole: 'Director', value: 'T1 50% · T2 30% · T3 20%', sub: 'OQ-007 정식 채택' },
  { level: 'L4', name: '팀원 (PIC)', icon: Users, editorRole: '자동 합산', value: 'Channel.picUserId', sub: 'Ben/Grace/Jane/Jasmine 자동' },
  { level: 'L5', name: '월별 시즌성', icon: Calendar, editorRole: 'SCM CRM (read-only)', value: `${currentMonth}월: ${seasonality}%`, sub: 'BR-008-5 — Sales 편집 불가, SCM 단일 소스' },
] as const

// 시즌성 가중치 (BR-008-5 SCM CRM 단일 소스 — 임시값. 실제는 SCM API에서 가져와야)
const SEASONALITY: Record<number, number> = {
  1: 6.5, 2: 7.0, 3: 8.0, 4: 9.5, 5: 10.0, 6: 8.5,
  7: 11.0, 8: 11.0, 9: 8.0, 10: 9.5, 11: 7.5, 12: 8.5,
}

export default function KPICascadeCard() {
  const { isAtLeast } = useAuth()
  const canEdit = isAtLeast('director')
  const [report, setReport] = useState<RealReport | null>(null)

  // PL-R3-005: 실데이터 연동
  useEffect(() => {
    loadReport(LATEST_WEEK).then(setReport).catch(() => {})
  }, [])

  // 동적 계산
  const month = new Date().getMonth() + 1
  const seasonalityPct = SEASONALITY[month] ?? 8.33
  // 임시 전사 연간 목표 ¥30B → 월 = ¥30B * seasonality% / 100, 권역 EA = 50%, 팀원 1/2
  const annualTTV = 30_000_000_000
  const monthlyTeam = annualTTV * (seasonalityPct / 100) * 0.5 * 0.5
  const myTargetLabel = `¥${(monthlyTeam / 1_000_000).toFixed(0)}M`
  const myTargetHint = `${month}월 시즌성 ${seasonalityPct}%`

  // 실적 — REPORT 주간 TTV 합산
  const weeklyActual = report?.kpi.totalTTV ?? 0
  const actualLabel = report ? `¥${(weeklyActual / 1_000_000).toFixed(0)}M` : '— (loading)'
  const actualPct = monthlyTeam > 0 ? (weeklyActual / monthlyTeam) * 100 : 0
  const actualHint = report ? `달성률 ${actualPct.toFixed(1)}% (주간)` : '실데이터 로드 중'
  const actualTrend: 'success' | 'warning' | 'danger' =
    actualPct >= 80 ? 'success' : actualPct >= 50 ? 'warning' : 'danger'

  // 권역 진척률 — 일본/한국/베트남에서 EA 추정
  const eaCountries = report?.countries.filter((c) =>
    ['일본', '한국', '중국', 'Japan', 'Korea', 'China', 'Hong Kong', 'Taiwan'].some((n) => c.country.includes(n))
  ) ?? []
  const eaTTV = eaCountries.reduce((s, c) => s + c.ttv, 0)
  const eaPct = monthlyTeam > 0 ? (eaTTV / (annualTTV * (seasonalityPct / 100) * 0.5)) * 100 : 0
  const regionLabel = report ? `EA ${eaPct.toFixed(1)}% / 기타 ${((1 - eaPct / 100) * 100).toFixed(0)}%` : '— (loading)'

  const cascadeLevels = buildCascadeLevels(month, seasonalityPct)

  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            KPI Cascade L1~L5 (FR-008)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            전사 → 권역 → 채널(Tier) → 팀원 → 월별 5단계 자동 배분
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
          시뮬레이션 데이터 (Phase 1.5에서 정식 편집 UI)
        </span>
      </div>

      <div className="space-y-2">
        {cascadeLevels.map((lv, idx) => {
          const Icon = lv.icon
          const isLast = idx === cascadeLevels.length - 1
          return (
            <div key={lv.level}>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{lv.level}</span>
                    <span className="text-sm font-semibold">{lv.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      편집: {lv.editorRole}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{lv.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{lv.sub}</div>
                </div>
                <button
                  disabled={!canEdit || lv.level === 'L5'}
                  className={cn(
                    'shrink-0 px-2 py-1 rounded text-[10px] border border-border',
                    canEdit && lv.level !== 'L5'
                      ? 'hover:bg-accent text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  )}
                  title={lv.level === 'L5' ? 'SCM CRM에서만 편집' : !canEdit ? 'Director 이상' : '편집 (Phase 1.5)'}
                >
                  편집
                </button>
              </div>
              {!isLast && (
                <div className="flex justify-center py-0.5">
                  <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
        <MyTargetCard label="내 목표 (시뮬)" value={myTargetLabel} hint={myTargetHint} />
        <MyTargetCard
          label={`실적 (${report?.period.start ?? '...'} 주)`}
          value={actualLabel}
          hint={actualHint}
          trend={actualTrend}
        />
        <MyTargetCard label="권역 진척률" value={regionLabel} hint="실데이터 기준 (Phase 1.5에서 권역 정확화)" />
      </div>
    </section>
  )
}

function MyTargetCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string
  value: string
  hint: string
  trend?: 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'text-base font-bold mt-0.5',
          trend === 'success' && 'text-emerald-600 dark:text-emerald-400',
          trend === 'warning' && 'text-amber-600 dark:text-amber-400',
          trend === 'danger' && 'text-red-500'
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  )
}
