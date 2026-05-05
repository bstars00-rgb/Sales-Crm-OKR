import { useMemo, useState } from 'react'
import {
  Briefcase, TrendingUp, Target, AlertTriangle, CheckCircle2, XCircle,
  ArrowUpRight, Filter, LayoutGrid, Table2, Download, GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockOpportunities, categorizeForecast, forecastTotal, winLossStats } from '@/mocks/opportunities'
import { mockClients } from '@/mocks/clients'
import { mockUsers } from '@/mocks/users'
import { useFilters } from '@/contexts/FilterContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/kpiCalc'
import { exportToCsv } from '@/utils/csvExport'
import type { Opportunity, OpportunityStage, OpportunityType, ForecastCategory } from '@/types'
import { toast } from 'sonner'

const STAGE_DEFS: { stage: OpportunityStage; label: string; color: string }[] = [
  { stage: 'Contact', label: '①Contact', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' },
  { stage: 'NDA', label: '②NDA', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  { stage: 'InDev', label: '③InDev', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  { stage: 'Testing', label: '④Testing', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30' },
  { stage: 'Won', label: '✅Won', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { stage: 'Lost', label: '❌Lost', color: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30' },
]

const TYPE_LABELS: Record<OpportunityType, string> = {
  NewIntegration: '신규 통합',
  Promotion: '프로모션',
  Renewal: '갱신',
  Upsell: '업셀',
  Expansion: '확장',
}

const FORECAST_CATEGORIES: { key: ForecastCategory; label: string; color: string; range: string }[] = [
  { key: 'Commit', label: 'Commit', color: 'text-emerald-600 dark:text-emerald-400', range: '≥90%' },
  { key: 'BestCase', label: 'BestCase', color: 'text-blue-600 dark:text-blue-400', range: '70-89%' },
  { key: 'Pipeline', label: 'Pipeline', color: 'text-amber-600 dark:text-amber-400', range: '30-69%' },
  { key: 'Omitted', label: 'Omitted', color: 'text-slate-500 dark:text-slate-400', range: '<30%' },
]

export default function OpportunitiesPage() {
  const { filters } = useFilters()
  const { user } = useAuth()
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'All'>('All')
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'All'>('All')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null)

  const canMoveStage = user?.role === 'director' || user?.role === 'regional_director' || user?.role === 'c_level' || user?.role === 'ceo'

  const handleDrop = (toStage: OpportunityStage) => {
    if (!draggingId) return
    const op = opportunities.find((o) => o.id === draggingId)
    if (!op || op.stage === toStage) {
      setDraggingId(null)
      setDragOverStage(null)
      return
    }
    // Won/Lost 전이는 Director 이상만 (BR-026-9)
    if ((toStage === 'Won' || toStage === 'Lost') && !canMoveStage) {
      toast.error(`${toStage} 전이는 Director 이상만 가능합니다 (BR-026-9 / AC-026-3b)`)
      setDraggingId(null)
      setDragOverStage(null)
      return
    }
    // probability 자동 갱신 (BR-026-8)
    const probMap: Record<OpportunityStage, number> = {
      Contact: 10, NDA: 20, InDev: 40, Testing: 70, Won: 100, Lost: 0,
    }
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === draggingId
          ? { ...o, stage: toStage, probability: probMap[toStage], updatedAt: new Date().toISOString() }
          : o
      )
    )
    toast.success(`${op.name} → ${toStage} (probability ${probMap[toStage]}%)`)
    setDraggingId(null)
    setDragOverStage(null)
  }

  const handleExport = () => {
    exportToCsv('opportunities', filtered, [
      { key: 'id', header: 'ID' },
      { key: (o) => mockClients.find((c) => c.id === o.channelId)?.name ?? o.channelId, header: 'Channel' },
      { key: 'name', header: 'Opportunity' },
      { key: 'type', header: 'Type' },
      { key: 'amount', header: 'Amount' },
      { key: 'currency', header: 'Currency' },
      { key: 'probability', header: 'Probability(%)' },
      { key: 'stage', header: 'Stage' },
      { key: (o) => mockUsers.find((u) => u.id === o.ownerUserId)?.name ?? o.ownerUserId, header: 'Owner' },
      { key: 'closeDate', header: 'CloseDate' },
      { key: (o) => categorizeForecast(o.probability), header: 'ForecastCategory' },
      { key: 'lostReason', header: 'LostReason' },
    ])
    toast.success(`${filtered.length}건 CSV 내보내기 완료`)
  }

  // 사이드바 + 페이지 필터 적용
  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (stageFilter !== 'All' && o.stage !== stageFilter) return false
      if (typeFilter !== 'All' && o.type !== typeFilter) return false
      if (filters.selectedChannelId && o.channelId !== filters.selectedChannelId) return false
      if (filters.pic !== 'All' && o.ownerUserId !== filters.pic) return false
      return true
    })
  }, [opportunities, stageFilter, typeFilter, filters.pic, filters.selectedChannelId])

  // Funnel 카운트 (Open만, Won/Lost 제외)
  const funnelCounts = useMemo(() => {
    const counts: Record<OpportunityStage, number> = {
      Contact: 0, NDA: 0, InDev: 0, Testing: 0, Won: 0, Lost: 0,
    }
    for (const o of filtered) counts[o.stage]++
    return counts
  }, [filtered])

  // Forecast 합계
  const forecastSums = useMemo(() => {
    return FORECAST_CATEGORIES.map((c) => ({
      ...c,
      amount: forecastTotal(filtered, c.key),
      count: filtered.filter(
        (o) => categorizeForecast(o.probability) === c.key && o.stage !== 'Won' && o.stage !== 'Lost'
      ).length,
    }))
  }, [filtered])

  const stats = winLossStats(filtered)

  const totalOpenAmount = filtered
    .filter((o) => o.stage !== 'Won' && o.stage !== 'Lost')
    .reduce((s, o) => s + o.amount, 0)
  const totalCommit = forecastSums[0].amount

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Opportunities
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              FR-026 · Round 6 격상
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            B2B 거래 추적 — Channel당 다건 동시 거래, Pipeline Stage Opportunity-level (FR-026/027/028)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1 px-3 h-9 text-xs font-medium transition-colors',
                viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
              )}
              aria-label="Table view"
            >
              <Table2 className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1 px-3 h-9 text-xs font-medium transition-colors border-l border-border',
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
              )}
              aria-label="Kanban view"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
            title="CSV로 내보내기"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => toast.info('Opportunity 신규 생성 모달 (Phase 2)')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            <ArrowUpRight className="w-4 h-4" /> Opportunity 추가
          </button>
        </div>
      </div>

      {/* Forecast Categories (FR-028 Bottom-up) */}
      <section className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Forecast Categories <span className="text-xs text-muted-foreground">(FR-028, Bottom-up)</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            Open Total: <span className="font-semibold text-foreground">{formatCurrency(totalOpenAmount)}</span>
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {forecastSums.map((c) => (
            <div key={c.key} className="bg-background border border-border rounded-md p-3">
              <div className="flex items-baseline justify-between mb-1">
                <p className={cn('text-xs font-medium', c.color)}>{c.label}</p>
                <span className="text-[10px] text-muted-foreground">{c.range}</span>
              </div>
              <p className={cn('text-2xl font-bold tabular-nums', c.color)}>
                {formatCurrency(c.amount)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{c.count}건</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          ※ Commit = 확률 ≥90% (가중치 적용 안 함). BestCase/Pipeline/Omitted = amount × probability/100. Won/Lost 제외.
        </p>
      </section>

      {/* Funnel + Win/Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <section className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Opportunity Funnel
            <span className="text-xs text-muted-foreground font-normal">(Stage별 Open 거래)</span>
          </h3>
          <div className="space-y-2">
            {STAGE_DEFS.filter((s) => s.stage !== 'Won' && s.stage !== 'Lost').map((s) => {
              const count = funnelCounts[s.stage]
              const max = Math.max(1, ...Object.values(funnelCounts))
              const pct = (count / max) * 100
              const stageOps = filtered.filter((o) => o.stage === s.stage)
              const stageAmount = stageOps.reduce((sum, o) => sum + o.amount, 0)
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className={cn('inline-flex items-center justify-center w-20 px-2 py-1 rounded text-xs font-medium border', s.color)}>
                    {s.label}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-sm font-semibold tabular-nums">{count}건</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(stageAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Win/Loss */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Win/Loss Analysis
            <span className="text-xs text-muted-foreground font-normal">(FR-027)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2">
              <p className="text-[10px] text-muted-foreground">Won</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.won}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
              <p className="text-[10px] text-muted-foreground">Lost</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{stats.lost}</p>
            </div>
          </div>
          <div className="bg-background border border-border rounded-md p-2 mb-3">
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold tabular-nums">
              {(stats.winRate * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stats.total}건 종결 기준</p>
          </div>

          {Object.keys(stats.lostByReason).length > 0 && (
            <>
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Loss Reason 분포
              </p>
              <ul className="space-y-1">
                {Object.entries(stats.lostByReason).map(([reason, count]) => (
                  <li key={reason} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{reason}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
          className="h-8 rounded-md border border-input bg-background px-2"
          aria-label="Stage 필터"
        >
          <option value="All">전체 Stage</option>
          {STAGE_DEFS.map((s) => (
            <option key={s.stage} value={s.stage}>{s.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="h-8 rounded-md border border-input bg-background px-2"
          aria-label="Type 필터"
        >
          <option value="All">전체 Type</option>
          {(Object.keys(TYPE_LABELS) as OpportunityType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <span className="text-muted-foreground ml-auto">
          {filtered.length}/{mockOpportunities.length}건 표시
        </span>
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Channel</th>
                <th className="text-left px-3 py-2 font-medium">Opportunity</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-right px-3 py-2 font-medium">Amount</th>
                <th className="text-right px-3 py-2 font-medium">Prob</th>
                <th className="text-left px-3 py-2 font-medium">Stage</th>
                <th className="text-left px-3 py-2 font-medium">Owner</th>
                <th className="text-left px-3 py-2 font-medium">Close</th>
                <th className="text-left px-3 py-2 font-medium">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    매칭되는 Opportunity 없음
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const ch = mockClients.find((c) => c.id === o.channelId)
                  const owner = mockUsers.find((u) => u.id === o.ownerUserId)
                  const stageDef = STAGE_DEFS.find((s) => s.stage === o.stage)!
                  const fcat = categorizeForecast(o.probability)
                  const isClosed = o.stage === 'Won' || o.stage === 'Lost'
                  return (
                    <tr
                      key={o.id}
                      className={cn(
                        'border-t border-border hover:bg-accent/40 transition-colors',
                        o.stage === 'Lost' && 'opacity-60'
                      )}
                    >
                      <td className="px-3 py-2 font-medium text-xs">{ch?.name ?? o.channelId}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="font-medium">{o.name}</span>
                        {o.lostReason && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-600">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {o.lostReason}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">{TYPE_LABELS[o.type]}</td>
                      <td className="px-3 py-2 text-xs text-right tabular-nums">{formatCurrency(o.amount)}</td>
                      <td className="px-3 py-2 text-xs text-right tabular-nums">{o.probability}%</td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-medium border', stageDef.color)}>
                          {stageDef.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{owner?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-xs tabular-nums">{o.closeDate}</td>
                      <td className="px-3 py-2 text-xs">
                        {isClosed ? '—' : (
                          <span className={cn(
                            FORECAST_CATEGORIES.find((c) => c.key === fcat)?.color
                          )}>
                            {fcat}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Kanban view (FR-026 Drag-drop, Option C) */}
      {viewMode === 'kanban' && (
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 min-h-[400px]">
            {STAGE_DEFS.map((stageDef) => {
              const stageOps = filtered.filter((o) => o.stage === stageDef.stage)
              const stageAmount = stageOps.reduce((s, o) => s + o.amount, 0)
              const isDragOver = dragOverStage === stageDef.stage
              return (
                <div
                  key={stageDef.stage}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStage(stageDef.stage) }}
                  onDragLeave={() => setDragOverStage((curr) => curr === stageDef.stage ? null : curr)}
                  onDrop={() => handleDrop(stageDef.stage)}
                  className={cn(
                    'rounded-md border-2 border-dashed p-2 transition-all',
                    isDragOver
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-border bg-muted/20'
                  )}
                >
                  {/* Stage Header */}
                  <div className={cn('rounded px-2 py-1.5 mb-2 border', stageDef.color)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{stageDef.label}</span>
                      <span className="text-[10px] tabular-nums">{stageOps.length}</span>
                    </div>
                    <p className="text-[9px] mt-0.5 tabular-nums opacity-80">
                      {formatCurrency(stageAmount)}
                    </p>
                  </div>
                  {/* Cards */}
                  <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                    {stageOps.length === 0 ? (
                      <li className="text-[10px] text-muted-foreground text-center py-3">
                        {isDragOver ? '여기에 놓기' : '비어 있음'}
                      </li>
                    ) : (
                      stageOps.map((o) => {
                        const ch = mockClients.find((c) => c.id === o.channelId)
                        const owner = mockUsers.find((u) => u.id === o.ownerUserId)
                        const isDragging = draggingId === o.id
                        return (
                          <li
                            key={o.id}
                            draggable
                            onDragStart={() => setDraggingId(o.id)}
                            onDragEnd={() => { setDraggingId(null); setDragOverStage(null) }}
                            className={cn(
                              'bg-background border rounded p-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/40 transition-all',
                              isDragging && 'opacity-40 scale-95'
                            )}
                          >
                            <div className="flex items-start gap-1">
                              <GripVertical className="w-3 h-3 text-muted-foreground/50 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium leading-tight">{o.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                  {ch?.name ?? o.channelId}
                                </p>
                                <div className="flex items-baseline justify-between mt-1 gap-1">
                                  <span className="text-[10px] font-semibold tabular-nums">
                                    {formatCurrency(o.amount)}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground tabular-nums">
                                    {o.probability}%
                                  </span>
                                </div>
                                <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">
                                  {owner?.name} · {o.closeDate.slice(5)}
                                </p>
                                {o.lostReason && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] bg-red-500/10 text-red-600 mt-1">
                                    <AlertTriangle className="w-2 h-2" />
                                    {o.lostReason}
                                  </span>
                                )}
                              </div>
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
          <p className="text-[10px] text-muted-foreground mt-3">
            ※ 드래그하여 Stage 이동. Won/Lost 전이는 Director 이상만 가능 (BR-026-9). Probability는 Stage 기본값 자동 적용 (BR-026-8).
          </p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        ※ Round 6 격상 (2026-04-26): Opportunity 엔티티 신설. Channel 1:N Opportunity, Pipeline Stage = Opportunity-level.
        Channel.lifecycleStage(New/Active/Renewing/Churned)와 분리. Quota vs Forecast 비교는 Performance 페이지에서.
        총 Commit: <span className="font-semibold text-foreground">{formatCurrency(totalCommit)}</span>
      </p>
    </div>
  )
}
