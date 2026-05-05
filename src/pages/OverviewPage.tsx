import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, ArrowDownRight, Minus, Settings, Loader2,
  Calendar as CalendarIcon, ChevronDown,
  Briefcase, Target, CheckCircle2, AlertTriangle, TrendingUp, Activity,
  Bell, FileSignature, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/utils/kpiCalc'
import { toast } from 'sonner'
import KPISettingsModal from '@/components/common/KPISettingsModal'
import { loadReport, LATEST_WEEK, type RealReport } from '@/services/reportData'
import { useFilters, SALES_COUNTRIES } from '@/contexts/FilterContext'
import { mockUsers, SALES_PICS } from '@/mocks/users'
import { mockClients } from '@/mocks/clients'
import { mockOpportunities, categorizeForecast, forecastTotal, winLossStats } from '@/mocks/opportunities'
import { mockContractChanges } from '@/mocks/contracts'
import { mockDecisions } from '@/mocks/decisions'
import { mockAlerts } from '@/mocks/alerts'
import type { OpportunityStage, ForecastCategory } from '@/types'

// ──────────── Period Filter (oh-crm 패턴, BR-011-1 정합) ────────────
const DATE_TYPES = [
  { key: 'booking', label: 'Booking Date' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'checkout', label: 'Check-out' },
] as const

const PERIOD_PRESETS = [
  { key: 'day_before', label: 'The Day Before' },
  { key: 'current_date', label: 'Current Date' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'current_week', label: 'Current Week' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'current_month', label: 'Current Month' },
  { key: 'custom', label: 'Choose Specific Period' },
] as const
type PresetKey = (typeof PERIOD_PRESETS)[number]['key']

function getPresetDates(preset: PresetKey, today = new Date()): { start: string; end: string } {
  const f = (d: Date) => d.toISOString().split('T')[0]
  switch (preset) {
    case 'day_before': {
      const d = new Date(today); d.setDate(today.getDate() - 1)
      return { start: f(d), end: f(d) }
    }
    case 'current_date':
      return { start: f(today), end: f(today) }
    case 'last_week': {
      const dow = today.getDay()
      const s = new Date(today); s.setDate(today.getDate() - dow - 6)
      const e = new Date(s); e.setDate(s.getDate() + 6)
      return { start: f(s), end: f(e) }
    }
    case 'current_week': {
      const dow = today.getDay()
      const s = new Date(today); s.setDate(today.getDate() - dow + 1)
      const e = new Date(s); e.setDate(s.getDate() + 6)
      return { start: f(s), end: f(e) }
    }
    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const e = new Date(today.getFullYear(), today.getMonth(), 0)
      return { start: f(s), end: f(e) }
    }
    case 'current_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1)
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { start: f(s), end: f(e) }
    }
    default:
      return { start: f(today), end: f(today) }
  }
}

const STAGE_COLORS: Record<OpportunityStage, string> = {
  Contact: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  NDA: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  InDev: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Testing: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  Won: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Lost: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

const FORECAST_DEFS: { key: ForecastCategory; label: string; color: string }[] = [
  { key: 'Commit', label: 'Commit', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'BestCase', label: 'BestCase', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'Pipeline', label: 'Pipeline', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'Omitted', label: 'Omitted', color: 'text-slate-500 dark:text-slate-400' },
]

function ChangeIndicator({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" /> {label} N/A
      </span>
    )
  }
  const isPositive = value >= 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
    )}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {label} {formatPercent(value)}
    </span>
  )
}

export default function OverviewPage() {
  const { filters } = useFilters()
  const [kpiSettingsOpen, setKpiSettingsOpen] = useState(false)
  // 데이터 로드는 최신 REPORT (Phase 1.5에서 DB 동기화 시 기간별 fetch)
  const [report, setReport] = useState<RealReport | null>(null)
  const [loading, setLoading] = useState(true)

  // Period 필터 (Overview 내부) — 디폴트: Booking Date 기준 어제 예약건
  const [dateType, setDateType] = useState<(typeof DATE_TYPES)[number]['key']>('booking')
  const [preset, setPreset] = useState<PresetKey>('day_before')
  const presetDates = useMemo(() => getPresetDates(preset), [preset])
  const [customStart, setCustomStart] = useState(presetDates.start)
  const [customEnd, setCustomEnd] = useState(presetDates.end)
  useEffect(() => {
    if (preset !== 'custom') {
      const d = getPresetDates(preset)
      setCustomStart(d.start)
      setCustomEnd(d.end)
    }
  }, [preset])
  const periodStart = preset === 'custom' ? customStart : presetDates.start
  const periodEnd = preset === 'custom' ? customEnd : presetDates.end

  useEffect(() => {
    setLoading(true)
    loadReport(LATEST_WEEK).then(setReport).finally(() => setLoading(false))
  }, [])

  // 사이드바 필터 적용 — 채널 후보군
  const filteredChannelIds = useMemo(() => {
    return mockClients
      .filter((c) => {
        if (filters.salesCountries.length > 0) {
          // Channel.country 매핑 (간이 — 실제로는 ISO code 매핑 필요)
          const countryMap: Record<string, string[]> = {
            CN: ['China', 'Hong Kong'], HK: ['Hong Kong'], TW: ['Taiwan'],
            KR: ['Korea', 'South Korea'], JP: ['Japan'], RU: ['Russia'],
            IN: ['India'], VN: ['Vietnam'], ID: ['Indonesia'],
            MY: ['Malaysia'], SG: ['Singapore'],
          }
          const allowed = filters.salesCountries.flatMap((cc) => countryMap[cc] ?? [])
          if (!c.country || !allowed.includes(c.country)) return false
        }
        if (filters.pic !== 'All') {
          if ((c.assignedManager ?? c.picUserId) !== filters.pic) return false
        }
        if (filters.selectedChannelId && c.id !== filters.selectedChannelId) return false
        return true
      })
      .map((c) => c.id)
  }, [filters.salesCountries, filters.pic, filters.selectedChannelId])

  // Opportunities 필터 적용
  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter((o) => filteredChannelIds.includes(o.channelId))
  }, [filteredChannelIds])

  // Pipeline funnel 카운트
  const funnelCounts = useMemo(() => {
    const counts: Record<OpportunityStage, number> = {
      Contact: 0, NDA: 0, InDev: 0, Testing: 0, Won: 0, Lost: 0,
    }
    for (const o of filteredOpportunities) counts[o.stage]++
    return counts
  }, [filteredOpportunities])

  // Forecast
  const forecastSums = useMemo(
    () => FORECAST_DEFS.map((c) => ({ ...c, amount: forecastTotal(filteredOpportunities, c.key) })),
    [filteredOpportunities]
  )

  // Win/Loss
  const winLoss = useMemo(() => winLossStats(filteredOpportunities), [filteredOpportunities])

  // Critical 알림 수
  const criticalAlertCount = useMemo(
    () => mockAlerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
    []
  )

  // 진행중 계약변경
  const activeContracts = useMemo(
    () => mockContractChanges.filter((c) => c.status === 'InProgress' || c.status === 'Pending').length,
    []
  )

  // 미결정 의사결정
  const openDecisions = useMemo(
    () => mockDecisions.filter((d) => d.status === 'Open' || d.status === 'UnderReview').length,
    []
  )

  if (loading || !report) {
    return (
      <div className="w-full py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Overview 데이터 로딩 중...</span>
      </div>
    )
  }

  const k = report.kpi
  const dependency = report.ctrip
  const sidebarActive =
    filters.salesCountries.length > 0 || filters.pic !== 'All' || filters.selectedChannelId !== null

  // 사이드바 필터 적용된 채널 Top 5 (REPORT 데이터 기준)
  const filteredChannelNames = new Set(
    mockClients.filter((c) => filteredChannelIds.includes(c.id)).map((c) => c.name)
  )
  const top5Channels = sidebarActive
    ? report.channels.filter((c) => filteredChannelNames.has(c.channel)).slice(0, 5)
    : report.channels.slice(0, 5)
  const top5Total = top5Channels.reduce((s, c) => s + c.ttv, 0)

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Overview — 영업 통합 대시보드
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              메인 페이지
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            DB 동기화 (BR-011-1, 매일 03:00 KST) · 통화 ¥JPY 고정 · 사이드바 필터 + 페이지 Period 결합 적용
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKpiSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> KPI 설정
          </button>
        </div>
      </div>

      {/* Period 필터 바 */}
      <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2 flex-wrap text-xs">
        {/* Date Type */}
        <span className="text-muted-foreground font-semibold">Period:</span>
        <div className="inline-flex border border-border rounded-md overflow-hidden">
          {DATE_TYPES.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setDateType(d.key)}
              className={cn(
                'px-3 h-8 text-xs font-medium transition-colors',
                i > 0 && 'border-l border-border',
                dateType === d.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Preset */}
        <div className="relative inline-flex items-center">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetKey)}
            className="appearance-none pl-3 pr-7 h-8 border border-border rounded-md bg-background hover:bg-accent cursor-pointer text-xs"
            aria-label="기간 프리셋"
          >
            {PERIOD_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none text-muted-foreground" />
        </div>

        {/* Calendar */}
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setCustomStart(e.target.value)}
            disabled={preset !== 'custom'}
            className="h-8 text-xs border border-border rounded px-2 bg-background w-[130px] disabled:opacity-60"
          />
          <span className="text-muted-foreground">~</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            disabled={preset !== 'custom'}
            className="h-8 text-xs border border-border rounded px-2 bg-background w-[130px] disabled:opacity-60"
          />
        </div>

        {/* 적용 기간 표시 */}
        <span className="ml-auto text-[10px] text-muted-foreground">
          적용 기간 <span className="font-mono text-foreground/80">{periodStart} ~ {periodEnd}</span>
        </span>
      </div>

      {/* 사이드바 활성 필터 표시 */}
      {sidebarActive && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-muted-foreground font-medium">사이드바 필터:</span>
          {filters.salesCountries.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              판매국가 {filters.salesCountries.length}개 ({filters.salesCountries.map((c) => SALES_COUNTRIES.find((s) => s.code === c)?.flag).join(' ')})
            </span>
          )}
          {filters.pic !== 'All' && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              PIC {SALES_PICS.find((p) => p.id === filters.pic)?.name ?? filters.pic}
            </span>
          )}
          {filters.selectedChannelId && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              채널 {mockClients.find((c) => c.id === filters.selectedChannelId)?.name}
            </span>
          )}
          <span className="text-muted-foreground">→ 채널 {filteredChannelIds.length}개 / Opportunity {filteredOpportunities.length}건 매칭</span>
        </div>
      )}

      {/* Row 1: KPI Cards (5 + Ctrip Gauge) */}
      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary" />
          핵심 KPI <span className="text-xs text-muted-foreground font-normal">({DATE_TYPES.find((d) => d.key === dateType)?.label} · {PERIOD_PRESETS.find((p) => p.key === preset)?.label})</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { title: 'TTV', value: k.totalTTV, wow: k.wowTTV, isCurrency: true },
            { title: 'Revenue', value: k.totalRevenue, wow: k.wowRevenue, isCurrency: true },
            { title: 'Room Nights', value: k.totalRN, wow: k.wowRN, isCurrency: false },
            { title: 'Bookings', value: k.totalCount, wow: k.wowCount, isCurrency: false },
          ].map((card) => (
            <button
              key={card.title}
              onClick={() => toast.info(`${card.title} 상세 드릴다운`)}
              className="bg-card border border-border rounded-lg p-3 text-left hover:shadow-md hover:border-primary/30 transition-all"
            >
              <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
              <p className="text-xl font-bold tracking-tight mb-2">
                {card.isCurrency ? formatCurrency(card.value) : card.value.toLocaleString()}
              </p>
              <ChangeIndicator value={card.wow} label="WoW" />
            </button>
          ))}
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Ctrip TTV%</p>
            <p className={cn(
              'text-xl font-bold tracking-tight mb-1',
              dependency.ctripPct > 0.35 ? 'text-red-500' : 'text-emerald-600'
            )}>
              {(dependency.ctripPct * 100).toFixed(1)}%
            </p>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', dependency.ctripPct > 0.35 ? 'bg-red-500' : 'bg-emerald-500')}
                style={{ width: `${Math.min(100, dependency.ctripPct * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">목표 ≤35% (CEO OKR)</p>
          </div>
        </div>
      </section>

      {/* Row 2: Pipeline Funnel + Forecast + Win/Loss (Round 9 Option B) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Pipeline Funnel */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-primary" />
            Pipeline Funnel
          </h3>
          <ul className="space-y-1.5">
            {(['Contact', 'NDA', 'InDev', 'Testing'] as OpportunityStage[]).map((stage) => {
              const count = funnelCounts[stage]
              const max = Math.max(1, ...Object.values(funnelCounts).slice(0, 4))
              const pct = (count / max) * 100
              return (
                <li key={stage} className="flex items-center gap-2">
                  <span className={cn('w-16 px-2 py-0.5 rounded text-[10px] font-medium', STAGE_COLORS[stage])}>
                    {stage}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-8 text-right">{count}</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-baseline gap-1">
              <span className="text-emerald-600 font-bold">{funnelCounts.Won}</span>
              <span className="text-muted-foreground">Won</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-red-600 font-bold">{funnelCounts.Lost}</span>
              <span className="text-muted-foreground">Lost</span>
            </div>
          </div>
        </div>

        {/* Forecast Categories */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" />
            Forecast (Bottom-up)
          </h3>
          <ul className="space-y-2">
            {forecastSums.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
                <span className={cn('font-medium', c.color)}>{c.label}</span>
                <span className="font-bold tabular-nums">{formatCurrency(c.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/50">
            ≥90% Commit · 70-89% BestCase · 30-69% Pipeline · &lt;30% Omitted (BR-028-1)
          </p>
        </div>

        {/* Win/Loss */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Win/Loss Analysis
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2">
              <p className="text-[10px] text-muted-foreground">Won</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums">{winLoss.won}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
              <p className="text-[10px] text-muted-foreground">Lost</p>
              <p className="text-xl font-bold text-red-600 tabular-nums">{winLoss.lost}</p>
            </div>
          </div>
          <div className="bg-background border border-border rounded-md p-2">
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold tabular-nums">{(winLoss.winRate * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{winLoss.total}건 종결 기준</p>
          </div>
        </div>
      </section>

      {/* Row 3: Channel Top + Country Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Channel Top {top5Channels.length}
              {sidebarActive && <span className="text-xs text-muted-foreground font-normal ml-2">(필터 적용)</span>}
            </h3>
            <span className="text-xs text-muted-foreground">실데이터 · WoW</span>
          </div>
          {top5Channels.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">필터 매칭 채널 없음</p>
          ) : (
            <div className="space-y-2">
              {top5Channels.map((c, i) => {
                const pct = top5Total > 0 ? (c.ttv / top5Total) * 100 : 0
                return (
                  <div key={c.channel} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                    <span className="w-5 text-xs font-mono text-muted-foreground">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{c.channel}</span>
                        <ChangeIndicator value={c.wow} label="" />
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(c.ttv)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Country Mix</h3>
          <div className="space-y-2">
            {report.countries.slice(0, 6).map((c) => {
              const pct = (c.ttv / k.totalTTV) * 100
              return (
                <div key={c.country}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-xs font-medium truncate">{c.country}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Row 4: Dependency Monitor */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          Dependency Monitor (CEO OKR v9 KR6)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Gauge label="Ctrip TTV%" value={dependency.ctripPct} target={0.35} threshold="≤35%" />
          <Gauge label="China B2B%" value={dependency.chinaPct} target={0.65} threshold="≤65%" />
          <Gauge label="Top3 Non-Ctrip%" value={dependency.top3Pct} target={null} threshold="—" />
        </div>
      </section>

      {/* Row 5: Quick Stats — 알림/계약/의사결정 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickStat
          icon={Bell}
          label="Critical 알림"
          value={criticalAlertCount}
          link="알림 패널 열기 →"
          onClick={() => toast.info('알림 패널은 우상단 종 아이콘에서 열기')}
          color="red"
        />
        <QuickStat
          icon={FileSignature}
          label="진행중 계약변경"
          value={activeContracts}
          link="Contracts 페이지 →"
          onClick={() => { window.location.hash = '#/contracts' }}
          color="amber"
        />
        <QuickStat
          icon={Sparkles}
          label="미결 의사결정"
          value={openDecisions}
          link="Decisions 페이지 →"
          onClick={() => { window.location.hash = '#/decisions' }}
          color="blue"
        />
      </div>

      {/* Row 6: Daily Trend */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Daily Trend (4주 28일, Booking Date 기준)</h3>
        <DailyTrendChart data={report.dailyTrend} />
      </section>

      <p className="text-[10px] text-muted-foreground">
        ※ Round 10 (2026-04-28): Overview 메인 대시보드로 격상. 모든 직급 로그인 후 / 자동 라우팅. DB 동기화 (BR-011-1) 후 모든 통계가 실시간 반영.
        Period 필터 결과: <span className="font-mono">{dateType}</span> {periodStart} ~ {periodEnd}
        ({PERIOD_PRESETS.find((p) => p.key === preset)?.label})
      </p>

      <KPISettingsModal open={kpiSettingsOpen} onClose={() => setKpiSettingsOpen(false)} />
    </div>
  )
}

function QuickStat({
  icon: Icon, label, value, link, onClick, color,
}: {
  icon: typeof Bell
  label: string
  value: number
  link: string
  onClick: () => void
  color: 'red' | 'amber' | 'blue'
}) {
  const colorMap = {
    red: 'text-red-600 dark:text-red-400 bg-red-500/10',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  }
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 text-left hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('p-1 rounded', colorMap[color])}>
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-primary mt-1">{link}</p>
    </button>
  )
}

function Gauge({ label, value, target, threshold }: { label: string; value: number; target: number | null; threshold: string }) {
  const exceeded = target !== null && value > target
  return (
    <div className="bg-background border border-border rounded-lg p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">{threshold}</span>
      </div>
      <p className={cn(
        'text-2xl font-bold mb-2',
        exceeded ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
      )}>
        {(value * 100).toFixed(1)}%
      </p>
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', exceeded ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
        {target !== null && (
          <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: `${target * 100}%` }} />
        )}
      </div>
    </div>
  )
}

function DailyTrendChart({ data }: { data: { date: string; ttv: number; revenue: number; count: number }[] }) {
  if (!data.length) return <div className="text-center py-12 text-sm text-muted-foreground">데이터 없음</div>
  const maxTTV = Math.max(0, ...data.map((d) => d.ttv))
  const maxCount = Math.max(0, ...data.map((d) => d.count))
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 min-w-[760px] h-32">
        {data.map((d) => {
          const ttvH = maxTTV > 0 ? (d.ttv / maxTTV) * 100 : 0
          const date = new Date(d.date)
          const isSat = date.getDay() === 6
          return (
            <div key={d.date} className="flex flex-col items-center flex-1 group" title={`${d.date}\nTTV ¥${(d.ttv / 1_000_000).toFixed(1)}M\n예약 ${d.count}`}>
              <div className="flex-1 flex items-end w-full">
                <div className={cn('w-full rounded-t', isSat ? 'bg-primary' : 'bg-primary/60', 'group-hover:bg-primary')} style={{ height: `${ttvH}%` }} />
              </div>
              <span className="text-[8px] text-muted-foreground mt-1 rotate-45 origin-bottom-left">{d.date.slice(5)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground mt-2">
        <span>최대 TTV ¥{(maxTTV / 1_000_000).toFixed(0)}M</span>
        <span>최대 예약 {maxCount.toLocaleString()}</span>
      </div>
    </div>
  )
}
