// /okr/retro — Quarter Retrospective Report (FR-033 AC-033-5)
// Round 14, 분기 종료 +3 영업일 자동 생성

import { useEffect, useState } from 'react'
import { useOkr } from '@/contexts/OkrContext'
import type { QuarterRetroReport } from '@/types'
import { CheckCircle2, AlertTriangle, FileDown, Share2, CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OkrRetroPage() {
  const { client, isHealthy } = useOkr()
  const [report, setReport] = useState<QuarterRetroReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setPageError(false)
    client
      .getQuarterRetro('Q3', 2026)
      .then(setReport)
      .catch(() => {
        setReport(null)
        setPageError(true)
      })
      .finally(() => setLoading(false))
  }, [client])

  if (!isHealthy || pageError) {
    return (
      <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
        <strong>OKR 시스템 일시 미연결</strong> — 작성한 내용은 곧 동기화됩니다 (5xx graceful degrade)
      </div>
    )
  }
  if (loading) return <div className="p-6 text-muted-foreground">로딩 중...</div>
  if (!report)
    return (
      <div className="p-6 text-muted-foreground">
        분기 회고 리포트는 분기 종료 +3 영업일에 자동 생성됩니다.
      </div>
    )

  const date = new Date(report.generatedAt).toLocaleDateString('ko-KR')

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold">2026 Q3 OKR 회고 리포트</h1>
        <p className="text-sm text-muted-foreground mt-1">자동 생성: {date} 23:00</p>
      </div>

      {/* KR 결과 */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">KR 달성 결과</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left py-2">KR</th>
              <th className="text-left py-2 w-32">최종 진척률</th>
              <th className="text-left py-2 w-28">Status</th>
              <th className="text-left py-2">비고</th>
            </tr>
          </thead>
          <tbody>
            {report.krResults.map((r) => {
              const pct = r.finalProgress === null ? 'N/A' : `${(r.finalProgress * 100).toFixed(0)}%`
              const isAchieved = r.status === 'achieved'
              return (
                <tr key={r.krId} className="border-b border-border/40">
                  <td className="py-2">
                    <span className="font-medium">{r.title}</span>
                  </td>
                  <td className="py-2 tabular-nums">{pct}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        isAchieved
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.status === 'at_risk'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : r.status === 'partial'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                      )}
                    >
                      {isAchieved && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">{r.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* Limiting Step 누적 */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">Limiting Step 발생 횟수 (이번 분기)</h2>
        <p className="text-2xl font-bold tabular-nums">{report.limitingStepCount}회</p>
        <div className="mt-3 space-y-1.5">
          {report.topLimitingKrs.map((k) => (
            <div key={k.krId} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{k.title}</span>
              <span className="font-medium tabular-nums">{k.count}회</span>
            </div>
          ))}
        </div>
      </section>

      {/* 매핑률 */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">Critical 6 매핑률 (전사 평균)</h2>
        <p className="text-2xl font-bold tabular-nums">{(report.mappingRate * 100).toFixed(0)}%</p>
        {report.mappingRateImprovement !== undefined && (
          <p
            className={cn(
              'text-xs mt-1',
              report.mappingRateImprovement > 0 ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            ↑ Q2 대비 +{(report.mappingRateImprovement * 100).toFixed(0)}%P 개선
          </p>
        )}
      </section>

      {/* alignment effectiveness */}
      {report.alignments.length > 0 && (
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3">Cross-team Alignment 효과성</h2>
          {report.alignments.map((a, i) => (
            <div key={i} className="border-l-4 border-violet-500 pl-3">
              <p className="text-sm font-medium">
                {a.fromKrId} ↔ {a.toKrId} (<span className="text-violet-600">{a.type}</span>)
              </p>
              <p className="text-xs text-muted-foreground mt-1">{a.note}</p>
            </div>
          ))}
        </section>
      )}

      {/* 권장사항 */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">다음 분기 권장사항 (자동 분석)</h2>
        <ul className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Action buttons */}
      <section className="flex gap-2">
        <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
          <FileDown className="w-4 h-4" /> PDF 다운로드
        </button>
        <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
          <Share2 className="w-4 h-4" /> 전사 공유 (Director+)
        </button>
        <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
          <CalendarPlus className="w-4 h-4" /> 회의 어젠다로 추가
        </button>
      </section>
    </div>
  )
}
