import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, ArrowDownRight, Loader2, FileDown, Share2, CheckCircle2,
  Building2, AlertTriangle, Tag, Sparkles, Compass, Briefcase, ListChecks,
  Plus, Trash2, Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/kpiCalc'
import { toast } from 'sonner'
import {
  loadReport, AVAILABLE_WEEKS, LATEST_WEEK,
  type RealReport, type TeamActionRow,
} from '@/services/reportData'

const PIC_BY_NAME: Record<string, string> = {
  Ben: 'u-tm', Grace: 'u-grace', Jane: 'u-jane', Jasmine: 'u-jasmine', Sophia: 'u-grace',
}

interface BriefItem {
  id: string
  channel: string
  content: string
  action: string
  sourceActivityIds: string[]
}

interface BriefSectionDef {
  key: string
  title: string
  icon: typeof Building2
  color: string
}

const SECTION_DEFS: BriefSectionDef[] = [
  { key: 'new-channel', title: '신규 채널 개발', icon: Building2, color: 'text-emerald-600' },
  { key: 'open-test', title: '오픈/테스트', icon: Sparkles, color: 'text-cyan-600' },
  { key: 'promotion', title: '프로모션·영업', icon: Tag, color: 'text-violet-600' },
  { key: 'issue', title: '이슈 대응', icon: AlertTriangle, color: 'text-red-600' },
  { key: 'regional', title: '지역별 하이라이트', icon: Compass, color: 'text-blue-600' },
  { key: 'next-week', title: 'Next Week Focus', icon: ListChecks, color: 'text-amber-600' },
]

function aggregateContrib(report: RealReport) {
  const map = new Map<string, { count: number; channels: Set<string> }>()
  for (const row of report.teamInput?.teamActions ?? []) {
    const key = row.author
    const e = map.get(key) ?? { count: 0, channels: new Set() }
    e.count += 1
    e.channels.add(row.channel)
    map.set(key, e)
  }
  return Array.from(map.entries())
    .map(([author, v]) => ({
      author,
      userId: PIC_BY_NAME[author] ?? '?',
      activityCount: v.count,
      channelCount: v.channels.size,
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
}

export default function WeeklyBriefPage() {
  const { isAtLeast } = useAuth()
  const canManage = isAtLeast('team_manager')

  const [week, setWeek] = useState<string>(LATEST_WEEK)
  const [report, setReport] = useState<RealReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'Draft' | 'UnderReview' | 'Confirmed' | 'Published'>('Draft')

  // 섹션별 수동 입력 상태 — Manager가 직접 추가/삭제
  const [sectionItems, setSectionItems] = useState<Record<string, BriefItem[]>>(() =>
    Object.fromEntries(SECTION_DEFS.map((s) => [s.key, []]))
  )

  useEffect(() => {
    setLoading(true)
    loadReport(week)
      .then(setReport)
      .finally(() => setLoading(false))
  }, [week])

  // 주차 변경 시 작성 내용 초기화 + 상태 Draft
  useEffect(() => {
    setSectionItems(Object.fromEntries(SECTION_DEFS.map((s) => [s.key, []])))
    setStatus('Draft')
  }, [week])

  const teamContrib = useMemo(() => (report ? aggregateContrib(report) : []), [report])
  const teamActions = report?.teamInput?.teamActions ?? []

  if (loading || !report) {
    return (
      <div className="w-full py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Weekly Brief 로딩 중...</span>
      </div>
    )
  }

  const k = report.kpi
  const dep = report.ctrip
  const totalItems = Object.values(sectionItems).reduce((s, arr) => s + arr.length, 0)

  const addItem = (sectionKey: string, base?: TeamActionRow) => {
    const newItem: BriefItem = {
      id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: base?.channel ?? '',
      content: base?.content ?? '',
      action: base?.action ?? '',
      sourceActivityIds: base ? [`team-action-${teamActions.indexOf(base)}`] : [],
    }
    setSectionItems((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] ?? []), newItem],
    }))
  }

  const updateItem = (sectionKey: string, id: string, patch: Partial<BriefItem>) => {
    setSectionItems((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }))
  }

  const removeItem = (sectionKey: string, id: string) => {
    setSectionItems((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((i) => i.id !== id),
    }))
  }

  const handleConfirm = () => {
    if (totalItems === 0) {
      toast.error('최소 1개 항목을 작성하세요')
      return
    }
    setStatus('Confirmed')
    toast.success('Weekly Sales Brief 확정', {
      description: '내부 PDF + 외부 공유 토큰(24시간) 생성 완료 (시뮬레이션)',
    })
  }
  const handleShare = () => {
    if (status !== 'Confirmed') {
      toast.error('Brief를 먼저 확정하세요')
      return
    }
    const shareUrl = `https://crm.omh.com/share/abc123-${week}`
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    toast.success('외부 공유 URL이 클립보드에 복사됨', {
      description: `${shareUrl} (24시간 유효)`,
    })
  }
  const handleDownload = () => {
    if (status !== 'Confirmed') {
      toast.error('Brief를 먼저 확정하세요')
      return
    }
    toast.success('PDF 다운로드 시작 (시뮬레이션)')
  }

  const StatusBadge = () => {
    const colorMap = {
      Draft: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
      UnderReview: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      Confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      Published: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    }
    return (
      <span className={cn('text-xs font-medium px-2 py-1 rounded', colorMap[status])}>
        {status}
      </span>
    )
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Weekly Sales Brief</h2>
            <StatusBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {report.period.start} ~ {report.period.end} · 수동 작성 {totalItems}건 · 팀 활동 {teamActions.length}건 참고
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={week}
            onChange={(e) => { setWeek(e.target.value); setStatus('Draft') }}
            className="px-3 py-1.5 text-xs bg-background border border-border rounded-md"
          >
            {AVAILABLE_WEEKS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          {canManage && status !== 'Confirmed' && (
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> 확정 → 전사 공유
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={status !== 'Confirmed'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" /> 내부 PDF
          </button>
          <button
            onClick={handleShare}
            disabled={status !== 'Confirmed'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" /> 24h 외부 링크
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <KpiTile label="Bookings" value={k.totalCount.toLocaleString()} wow={k.wowCount} />
        <KpiTile label="RN" value={k.totalRN.toLocaleString()} wow={k.wowRN} />
        <KpiTile label="TTV" value={formatCurrency(k.totalTTV)} wow={k.wowTTV} />
        <KpiTile label="Revenue" value={formatCurrency(k.totalRevenue)} wow={k.wowRevenue} />
        <KpiTile
          label="Ctrip%"
          value={`${(dep.ctripPct * 100).toFixed(1)}%`}
          wow={null}
          highlight={dep.ctripPct > 0.35 ? 'red' : 'green'}
        />
        <KpiTile
          label="China%"
          value={`${(dep.chinaPct * 100).toFixed(1)}%`}
          wow={null}
          highlight={dep.chinaPct > 0.65 ? 'red' : 'green'}
        />
        <KpiTile label="Top3 Non-Ctrip" value={`${(dep.top3Pct * 100).toFixed(1)}%`} wow={null} />
      </section>

      {/* Main 2-col: 섹션 작성 폼(좌) + 팀 활동 참조(우) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 6 Sections — 수동 작성 */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTION_DEFS.map((s) => (
            <SectionCard
              key={s.key}
              def={s}
              items={sectionItems[s.key] ?? []}
              readonly={!canManage || status === 'Confirmed'}
              onAdd={() => addItem(s.key)}
              onUpdate={(id, patch) => updateItem(s.key, id, patch)}
              onRemove={(id) => removeItem(s.key, id)}
            />
          ))}
        </div>

        {/* 팀 활동 참조 패널 */}
        <aside className="bg-card border border-border rounded-lg p-4 h-fit lg:sticky lg:top-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">팀 활동 로그 (참고)</h3>
            <span className="text-xs text-muted-foreground">{teamActions.length}건</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            행 클릭 시 적합한 섹션에 자동 첨부 (sourceActivityIds 추적).
          </p>
          <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {teamActions.length === 0 ? (
              <li className="text-xs text-muted-foreground py-3">집계된 활동 없음</li>
            ) : (
              teamActions.map((row, i) => (
                <li
                  key={i}
                  className="border border-border/60 rounded p-2 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold">{row.channel}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{row.type}</span>
                    <span className="text-[10px] text-muted-foreground">· {row.author}</span>
                  </div>
                  <p className="text-[11px] text-foreground/80 mt-1 line-clamp-2">{row.content}</p>
                  {canManage && status !== 'Confirmed' && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {SECTION_DEFS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => addItem(s.key, row)}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded border border-border/60 hover:bg-primary/10 hover:border-primary/40',
                            s.color,
                          )}
                          title={`${s.title}에 추가`}
                        >
                          + {s.title.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      {/* Team Contribution */}
      <section className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Team Contribution</h3>
        </div>
        <div className="space-y-2">
          {teamContrib.map((c) => {
            const max = teamContrib[0]?.activityCount ?? 1
            const pct = (c.activityCount / max) * 100
            return (
              <div key={c.author} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium shrink-0">{c.author}</span>
                <div className="flex-1 h-5 bg-muted rounded relative overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded flex items-center px-2"
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[10px] text-primary-foreground font-semibold">
                      {c.activityCount}건
                    </span>
                  </div>
                </div>
                <span className="w-24 text-xs text-muted-foreground tabular-nums shrink-0 text-right">
                  채널 {c.channelCount}개
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Decision Requests (REPORT decision 필드) */}
      {typeof report.decision === 'string' && (
        <section className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">의사결정 요청</h3>
          </div>
          <p className="text-xs text-muted-foreground">{report.decision}</p>
        </section>
      )}
    </div>
  )
}

function SectionCard({
  def, items, readonly, onAdd, onUpdate, onRemove,
}: {
  def: BriefSectionDef
  items: BriefItem[]
  readonly: boolean
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<BriefItem>) => void
  onRemove: (id: string) => void
}) {
  const Icon = def.icon
  return (
    <section className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', def.color)} />
          <h3 className="text-sm font-semibold">{def.title}</h3>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        {!readonly && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-border hover:bg-accent"
            title="항목 추가"
          >
            <Plus className="w-3 h-3" /> 추가
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">
          {readonly ? '작성된 항목 없음' : '"+ 추가" 또는 우측 활동 로그에서 항목을 가져오세요'}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="border-l-2 border-primary/30 pl-3 py-1">
              {readonly ? (
                <>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{item.channel || '(채널 없음)'}</span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5">{item.content}</p>
                  {item.action && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">↳ {item.action}</p>
                  )}
                  {item.sourceActivityIds.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      sourceActivityIds: {item.sourceActivityIds.join(', ')}
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <input
                      value={item.channel}
                      onChange={(e) => onUpdate(item.id, { channel: e.target.value })}
                      placeholder="채널명"
                      className="flex-1 h-6 text-xs px-2 rounded border border-input bg-background"
                    />
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <textarea
                    value={item.content}
                    onChange={(e) => onUpdate(item.id, { content: e.target.value })}
                    placeholder="내용"
                    rows={2}
                    className="w-full text-xs px-2 py-1 rounded border border-input bg-background"
                  />
                  <input
                    value={item.action}
                    onChange={(e) => onUpdate(item.id, { action: e.target.value })}
                    placeholder="후속 액션 (선택)"
                    className="w-full h-6 text-[11px] px-2 rounded border border-input bg-background"
                  />
                  {item.sourceActivityIds.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/70">
                      🔗 {item.sourceActivityIds.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function KpiTile({ label, value, wow, highlight }: { label: string; value: string; wow: number | null; highlight?: 'red' | 'green' }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'text-lg font-bold tracking-tight mt-0.5',
          highlight === 'red' && 'text-red-500',
          highlight === 'green' && 'text-emerald-600 dark:text-emerald-400'
        )}
      >
        {value}
      </p>
      {wow !== null && (
        <span className={cn('inline-flex items-center gap-0.5 text-[10px] mt-1', wow >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {wow >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {(wow * 100).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
