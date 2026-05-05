import { useEffect, useMemo, useState } from 'react'
import { Loader2, Users, AlertTriangle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  loadReport, AVAILABLE_WEEKS, LATEST_WEEK,
  type RealReport, type RealPipelineRow, type RealDevScheduleRow,
} from '@/services/reportData'

const STAGE_DEFS = [
  { code: '①', name: 'Contact', label: '①컨택트', color: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300', sla: 60 },
  { code: '②', name: 'NDA·Contract', label: '②NDA/계약', color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', sla: 30 },
  { code: '③', name: 'In Development', label: '③개발', color: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', sla: 90 },
  { code: '④', name: 'Testing', label: '④테스팅', color: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', sla: 30 },
  { code: '⑤', name: 'Live', label: '⑤라이브', color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', sla: null },
] as const

// PIC 이름 → user id 추정 (Critical6Section과 동일)
const PIC_NAME_TO_USERID: Record<string, string> = {
  Ben: 'u-tm', Grace: 'u-grace', Jane: 'u-jane', Jasmine: 'u-jasmine', Sophia: 'u-grace',
}

export default function PipelinePage() {
  const { user, isAtLeast } = useAuth()
  const [week, setWeek] = useState<string>(LATEST_WEEK)
  const [report, setReport] = useState<RealReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    loadReport(week).then(setReport).finally(() => setLoading(false))
  }, [week])

  // RBAC: Team Member는 본인 PIC 채널만 강조, Director+는 전체
  const canViewAll = isAtLeast('director')
  const myPicChannels = useMemo(() => {
    if (!report || canViewAll) return new Set<string>()
    const myName = user ? Object.keys(PIC_NAME_TO_USERID).find((n) => PIC_NAME_TO_USERID[n] === user.id) : null
    return new Set(report.pipeline.filter((p) => p.pic === myName).map((p) => p.channel))
  }, [report, canViewAll, user])

  const channelsByStage = useMemo(() => {
    if (!report) return new Map<string, RealPipelineRow[]>()
    const map = new Map<string, RealPipelineRow[]>()
    for (const row of report.pipeline) {
      const list = map.get(row.stage) ?? []
      list.push(row)
      map.set(row.stage, list)
    }
    return map
  }, [report])

  const ownerWorkload = useMemo(() => {
    if (!report) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const r of report.devSchedule) {
      const key = r.devOwner || '미할당'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [report])

  if (loading || !report) {
    return (
      <div className="w-full py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Pipeline 로딩 중...</span>
      </div>
    )
  }

  const totalChannels = report.pipeline.length

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            API · Channel Pipeline
            {!canViewAll && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">
                <Shield className="w-3 h-3" />
                본인 담당 강조 모드
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            {totalChannels}개 채널 · {report.devSchedule.length}개 Dev 프로젝트 · 실데이터
            {!canViewAll && myPicChannels.size > 0 && ` · 내 담당 ${myPicChannels.size}건`}
          </p>
        </div>
        <select
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="px-3 py-1.5 text-xs bg-background border border-border rounded-md"
        >
          {AVAILABLE_WEEKS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* Funnel */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">5단계 Pipeline Funnel</h3>
        <div className="grid grid-cols-5 gap-2">
          {STAGE_DEFS.map((s, i) => {
            const channels = channelsByStage.get(s.code) ?? []
            const count = channels.length
            const total = totalChannels || 1
            const pct = (count / total) * 100
            return (
              <div key={s.code} className="flex flex-col">
                <div className={cn('rounded-t-lg p-3 text-white', s.color)}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs opacity-90">{s.label}</div>
                </div>
                <div className="px-3 py-1.5 bg-muted/50 text-[10px] text-muted-foreground">
                  {pct.toFixed(0)}% · SLA {s.sla ?? '∞'}일
                </div>
                <ul className="flex-1 bg-card border border-border border-t-0 p-2 space-y-1 rounded-b-lg min-h-[120px] max-h-[200px] overflow-y-auto">
                  {channels.length === 0 ? (
                    <li className="text-[10px] text-muted-foreground italic text-center py-3">
                      해당 없음
                    </li>
                  ) : (
                    channels.map((c) => {
                      const isMine = myPicChannels.has(c.channel)
                      return (
                        <li
                          key={c.channel}
                          className={cn(
                            'text-xs px-1.5 py-1 rounded hover:bg-accent',
                            isMine ? 'bg-primary/10 ring-1 ring-primary/40' : 'bg-background',
                            !canViewAll && !isMine && 'opacity-60'
                          )}
                          title={`${c.channel} · ${c.country} · ${c.pic} · ${c.type}${isMine ? ' · 내 담당' : ''}`}
                        >
                          <div className="font-medium truncate flex items-center gap-1">
                            {c.channel}
                            {isMine && <span className="text-[8px]">★</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {c.country} · {c.pic}
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Channel matrix table */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Channel 상세 ({totalChannels})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground">
                <th className="px-2 py-2">채널</th>
                <th className="px-2 py-2">국가</th>
                <th className="px-2 py-2">단계</th>
                <th className="px-2 py-2">PIC</th>
                <th className="px-2 py-2">타입</th>
              </tr>
            </thead>
            <tbody>
              {report.pipeline.map((p, i) => {
                const stage = STAGE_DEFS.find((s) => s.code === p.stage)
                return (
                  <tr key={`${p.channel}-${i}`} className="border-b border-border/40 hover:bg-accent/40">
                    <td className="px-2 py-2 font-medium">{p.channel}</td>
                    <td className="px-2 py-2">{p.country}</td>
                    <td className="px-2 py-2">
                      <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-semibold', stage?.color, 'text-white')}>
                        {p.stageName}
                      </span>
                    </td>
                    <td className="px-2 py-2">{p.pic}</td>
                    <td className="px-2 py-2">{p.type}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Workload heatmap */}
      <section className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">DevOwner Workload (실데이터 {report.devSchedule.length}개 프로젝트)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from(ownerWorkload.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([owner, count]) => {
              const maxLoad = Math.max(...ownerWorkload.values())
              const pct = (count / maxLoad) * 100
              const isOverload = count >= 6
              return (
                <div key={owner} className="bg-background border border-border rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{owner}</span>
                    {isOverload && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', isOverload ? 'bg-red-500' : 'bg-primary')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{count}개 프로젝트</p>
                </div>
              )
            })}
        </div>
      </section>

      {/* Dev schedule sample */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Dev Schedule (Top 10)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground">
                <th className="px-2 py-2">카테고리</th>
                <th className="px-2 py-2">프로젝트</th>
                <th className="px-2 py-2">PIC</th>
                <th className="px-2 py-2">DevOwner</th>
                <th className="px-2 py-2">상태</th>
                <th className="px-2 py-2">기간</th>
              </tr>
            </thead>
            <tbody>
              {report.devSchedule.slice(0, 10).map((d: RealDevScheduleRow, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-accent/40">
                  <td className="px-2 py-2">{d.category}</td>
                  <td className="px-2 py-2 font-medium truncate max-w-[200px]">{d.project}</td>
                  <td className="px-2 py-2">{d.pic}</td>
                  <td className="px-2 py-2">{d.devOwner}</td>
                  <td className="px-2 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{d.status}</span>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">
                    {d.startMonth ? `${d.startYear}/${d.startMonth}` : '—'}
                    {d.endMonth ? ` ~ ${d.endYear}/${d.endMonth}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
