// /okr/team — Team OKR (FR-033)
// Round 14 — 팀 KR + alignment + 매핑된 Critical 6 task heatmap

import { useEffect, useState } from 'react'
import { useOkr } from '@/contexts/OkrContext'
import { mockKeyResults, mockObjectives, getAlignmentsByKr, getKrById } from '@/mocks/okr'
import type { KeyResult } from '@/types'
import { Target, Link2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
// USERS은 critical6.ts 내부 const라 export 안 됨 — 시연용 inline 사용
const TEAM_USERS = [
  { id: 'u-sales-1', name: '이지현 (TM)' },
  { id: 'u-sales-2', name: '박민수' },
  { id: 'u-sales-3', name: '김신입' },
  { id: 'u-sales-4', name: '최지영' },
  { id: 'u-sales-5', name: '정태호' },
  { id: 'u-sales-6', name: '오선우' },
]

export default function OkrTeamPage() {
  const { isHealthy } = useOkr()
  const [selectedKr, setSelectedKr] = useState<KeyResult | null>(null)

  if (!isHealthy) {
    return (
      <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
        <strong>OKR 시스템 일시 미연결</strong>
      </div>
    )
  }

  const teamObj = mockObjectives.find((o) => o.id === 'obj-sales-2026')
  const teamKrs = mockKeyResults.filter(
    (kr) => kr.objectiveId === 'obj-sales-2026' && kr.quarter === 'Q3',
  )
  const alignedKrs = teamKrs
    .flatMap((kr) => getAlignmentsByKr(kr.id))
    .map((a) => {
      const otherKrId = teamKrs.some((k) => k.id === a.fromKrId) ? a.toKrId : a.fromKrId
      return { alignment: a, kr: getKrById(otherKrId) }
    })
    .filter((x) => x.kr) as Array<{ alignment: ReturnType<typeof getAlignmentsByKr>[number]; kr: KeyResult }>

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Team OKR — Sales East Asia · 2026 Q3
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          팀 Objective + Quarterly KR + Cross-team alignment + 매핑된 Critical 6 task heatmap
        </p>
      </div>

      {/* Team Objective */}
      {teamObj && (
        <section className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Team Objective (분기 누적)</p>
              <h2 className="text-base font-semibold mt-1">{teamObj.title}</h2>
            </div>
            <ProgressPill progress={teamObj.progress} status={teamObj.status} />
          </div>
        </section>
      )}

      {/* KR list */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Quarterly Key Results</h3>
        <div className="space-y-2">
          {teamKrs.map((kr) => (
            <KrCard key={kr.id} kr={kr} onClick={() => setSelectedKr(kr)} active={selectedKr?.id === kr.id} />
          ))}
        </div>
      </section>

      {/* Cross-team Aligned KR */}
      {alignedKrs.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Link2 className="w-4 h-4 text-violet-500" /> Cross-team Aligned KR (read-only)
          </h3>
          <div className="space-y-2">
            {alignedKrs.map(({ alignment, kr }) => (
              <div
                key={alignment.id}
                className="bg-card border border-violet-200 dark:border-violet-800 border-l-4 border-l-violet-500 rounded-lg p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-violet-700 dark:text-violet-300 font-medium uppercase tracking-wide">
                      {alignment.type === 'depends_on' && 'depends on (의존)'}
                      {alignment.type === 'enables' && 'enables (가능하게 함)'}
                      {alignment.type === 'parallel_with' && 'parallel with (병렬)'}
                    </p>
                    <p className="text-sm font-medium mt-1">{kr.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alignment.description}</p>
                  </div>
                  <ProgressPill progress={kr.progress} status={kr.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team Mapping Heatmap */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">팀 Critical 6 매핑 현황</h3>
        <div className="space-y-2">
          {TEAM_USERS.map((u, i) => {
            const totalTasks = 4
            const linked = [4, 3, 0, 4, 3, 2][i] ?? 0
            const rate = linked / totalTasks
            const isNewbie = i === 2 // u-sales-3 = 김신입 시연
            return (
              <div key={u.id} className="flex items-center gap-3 text-sm">
                <span className="w-24 truncate">{u.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full',
                      rate >= 0.5 ? 'bg-emerald-500' : rate > 0 ? 'bg-amber-500' : 'bg-rose-300',
                    )}
                    style={{ width: `${rate * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                  {linked}/{totalTasks} ({Math.round(rate * 100)}%)
                </span>
                {isNewbie && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    입사 14일 면제
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Drill-down */}
      {selectedKr && (
        <section className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">매핑된 Critical 6 task — {selectedKr.title}</h3>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedKr(null)}
            >
              닫기
            </button>
          </div>
          <KrDrillDown kr={selectedKr} />
        </section>
      )}
    </div>
  )
}

function KrCard({ kr, onClick, active }: { kr: KeyResult; onClick: () => void; active: boolean }) {
  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-3 cursor-pointer transition-colors',
        active ? 'border-primary' : 'border-border hover:border-muted-foreground/40',
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{kr.title}</p>
            {kr.source === 'auto_kpi' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                auto KPI
              </span>
            )}
            {kr.alignedKrIds && kr.alignedKrIds.length > 0 && (
              <span className="text-xs flex items-center gap-1 text-violet-600 dark:text-violet-400">
                <Link2 className="w-3 h-3" /> alignment
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            target {formatTarget(kr)} · 현재 {formatCurrent(kr)} · weight {(kr.weight * 100).toFixed(0)}%
          </p>
        </div>
        <ProgressPill progress={kr.progress} status={kr.status} />
      </div>
    </div>
  )
}

function KrDrillDown({ kr }: { kr: KeyResult }) {
  // 시연용 stub — 실제는 client.getMappedTasks(kr.id) 호출
  const taskIds = ['task-101 (Trip.com 미팅)', 'task-102 (Booking.com 견적)', 'task-103 (Agoda 계약 검토)']
  if (kr.progress === null) {
    return (
      <p className="text-sm text-muted-foreground mt-3">
        매핑된 task 0건 — TS-OKR-001 데이터 없음 케이스. KR.progress=null로 표시되어 Limiting Step
        후보에서 자동 제외됩니다.
      </p>
    )
  }
  return (
    <ul className="text-sm space-y-1 mt-3">
      {taskIds.map((t) => (
        <li key={t} className="text-muted-foreground">• {t}</li>
      ))}
    </ul>
  )
}

function ProgressPill({ progress, status }: { progress: number | null; status: string }) {
  if (progress === null) {
    return <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">N/A</span>
  }
  const pct = Math.round(progress * 100)
  const color =
    status === 'achieved'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : status === 'behind'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      : status === 'at_risk'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
  return (
    <div className="flex items-center gap-2">
      {status === 'behind' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full',
            status === 'achieved'
              ? 'bg-emerald-500'
              : status === 'behind'
              ? 'bg-rose-500'
              : status === 'at_risk'
              ? 'bg-amber-500'
              : 'bg-blue-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs px-2 py-0.5 rounded font-medium tabular-nums', color)}>{pct}%</span>
    </div>
  )
}

function formatTarget(kr: KeyResult): string {
  if (kr.metric === 'currency') return `¥${(kr.target / 100_000_000).toFixed(0)}억`
  if (kr.metric === 'percent') return `${(kr.target * 100).toFixed(0)}%`
  return `${kr.target}${kr.unit}`
}

function formatCurrent(kr: KeyResult): string {
  if (kr.metric === 'currency') return `¥${(kr.current / 100_000_000).toFixed(1)}억`
  if (kr.metric === 'percent') return `${(kr.current * 100).toFixed(0)}%`
  return `${kr.current}${kr.unit}`
}
