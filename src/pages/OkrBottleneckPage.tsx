// /okr/bottleneck — Cross-team Bottleneck Chart (Andy Grove 평행 트랙)
// FR-033, Round 14, Director+ 권한
// 가장 뒤쳐진 KR (Limiting Step) + alignment 그래프 시각화

import { useEffect, useState } from 'react'
import { useOkr } from '@/contexts/OkrContext'
import type { KeyResult, Objective } from '@/types'
import { AlertTriangle, Link2, Target, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OkrBottleneckPage() {
  const { client, isHealthy } = useOkr()
  const [data, setData] = useState<{
    krs: Array<KeyResult & { objective?: Objective }>
    limitingKrId: string
    alignments: Array<{ fromKrId: string; toKrId: string; type: 'depends_on' | 'enables' | 'parallel_with' }>
  } | null>(null)

  useEffect(() => {
    client.getBottleneckData(2026, 'Q3').then(setData).catch(() => setData(null))
  }, [client])

  if (!isHealthy) return <div className="rounded-md bg-amber-50 p-4">OKR 시스템 일시 미연결</div>
  if (!data) return <div className="p-6 text-muted-foreground">로딩 중...</div>

  const limitingKr = data.krs.find((k) => k.id === data.limitingKrId)

  // 본부별 그룹
  const divGroups = data.krs.reduce((acc, kr) => {
    const divKey = kr.objective?.divisionId ?? 'unknown'
    const divLabel = divKey === 'div-sales' ? 'Sales' : divKey === 'div-scm' ? 'SCM' : divKey === 'div-marketing' ? 'Marketing' : divKey
    if (!acc[divLabel]) acc[divLabel] = []
    acc[divLabel].push(kr)
    return acc
  }, {} as Record<string, typeof data.krs>)

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Bottleneck Chart — 2026 Q3 (경과 50%)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Andy Grove의 평행 트랙 시각화 — 가장 뒤쳐진 KR(Limiting Step)이 회사 전체 출력을 제한합니다.
          alignment 관계를 통해 부서 간 의존성을 식별합니다.
        </p>
      </div>

      {/* Gantt-style chart per division */}
      <section className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header — 분기 타임라인 */}
          <div className="grid grid-cols-[120px_1fr_140px] gap-2 text-xs text-muted-foreground border-b border-border pb-2 mb-2">
            <span>본부 / KR</span>
            <div className="flex justify-between px-2">
              <span>Jul</span>
              <span>Aug (오늘)</span>
              <span>Sep</span>
            </div>
            <span className="text-right">진척률</span>
          </div>

          {Object.entries(divGroups).map(([divLabel, krs]) => (
            <div key={divLabel} className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2 mb-1">
                {divLabel}
              </p>
              {krs.map((kr) => (
                <KrTrack key={kr.id} kr={kr} isLimiting={kr.id === data.limitingKrId} />
              ))}
            </div>
          ))}

          {/* alignment lines (요약) */}
          {data.alignments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Cross-team Alignments</p>
              {data.alignments.map((a, i) => {
                const fromKr = data.krs.find((k) => k.id === a.fromKrId)
                const toKr = data.krs.find((k) => k.id === a.toKrId)
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                    <Link2 className="w-3 h-3" />
                    <span className="truncate">{fromKr?.title}</span>
                    <span className="text-muted-foreground">[{a.type}]</span>
                    <span className="truncate">{toKr?.title}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Limiting Step Alert */}
      {limitingKr && (
        <section className="bg-rose-50 dark:bg-rose-950 border-2 border-rose-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Limiting Step Alert</p>
              <p className="text-base font-semibold mt-1">{limitingKr.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                현재 진척률 {((limitingKr.progress ?? 0) * 100).toFixed(0)}% / 기대 50% — 가장 뒤쳐짐
              </p>
              <p className="text-sm mt-2">
                alignment된 Sales KR-S-1을 막고 있음 → <strong>회사 전체 출력 제한</strong>
              </p>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 text-xs rounded-md bg-rose-500 text-white hover:bg-rose-600 inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Alignment 미팅 잡기
                </button>
                <button className="px-3 py-1.5 text-xs rounded-md border border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900">
                  SCM Director에게 알림
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter */}
      <section className="text-xs text-muted-foreground">
        필터:
        <span className="inline-flex gap-2 ml-2">
          <FilterChip label="본부" />
          <FilterChip label="분기" />
          <FilterChip label="진척률 < 30%만" />
          <FilterChip label="Limiting Step만" />
        </span>
      </section>
    </div>
  )
}

function KrTrack({ kr, isLimiting }: { kr: KeyResult; isLimiting: boolean }) {
  const pct = (kr.progress ?? 0) * 100
  const expectedPct = 50 // Q3 경과 50%
  const isBehind = pct < expectedPct
  const color = isLimiting
    ? 'bg-rose-500'
    : kr.status === 'achieved'
    ? 'bg-emerald-500'
    : kr.status === 'behind'
    ? 'bg-rose-500'
    : kr.status === 'at_risk'
    ? 'bg-amber-500'
    : 'bg-emerald-500'

  return (
    <div className={cn('grid grid-cols-[120px_1fr_140px] gap-2 items-center py-1.5 hover:bg-muted/40 rounded px-1', isLimiting && 'bg-rose-50/50 dark:bg-rose-950/30')}>
      <span className="text-xs truncate">{kr.title}</span>
      <div className="relative h-5 bg-muted rounded">
        {/* expected progress (점선) */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-muted-foreground/40"
          style={{ left: `${expectedPct}%` }}
        />
        {/* actual progress */}
        <div
          className={cn('absolute top-0 bottom-0 left-0 rounded transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-right tabular-nums">
        {kr.progress === null ? (
          <span className="text-muted-foreground">N/A</span>
        ) : (
          <>
            <span className={cn(isLimiting && 'text-rose-600 font-semibold')}>{pct.toFixed(0)}%</span>
            {isLimiting && <span className="ml-1">🔴</span>}
            {isBehind && !isLimiting && <span className="ml-1 text-amber-500">⚠️</span>}
          </>
        )}
      </span>
    </div>
  )
}

function FilterChip({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-muted text-foreground text-xs cursor-pointer hover:bg-muted/70">
      {label}
    </span>
  )
}
