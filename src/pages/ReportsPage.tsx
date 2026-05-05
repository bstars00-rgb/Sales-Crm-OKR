import { useMemo, useState } from 'react'
import {
  BarChart3, PieChart, LineChart, Download, Filter as FilterIcon,
  Database, Layers, Plus, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockOpportunities } from '@/mocks/opportunities'
import { mockContractChanges } from '@/mocks/contracts'
import { mockDecisions } from '@/mocks/decisions'
import { mockClients } from '@/mocks/clients'
import { mockUsers } from '@/mocks/users'
import { exportToCsv } from '@/utils/csvExport'
import { formatCurrency } from '@/utils/kpiCalc'
import { toast } from 'sonner'

// Custom Report Builder demo (Option C C-3)
// Salesforce/HubSpot Custom Report 스타일 — Source / Filter / Group By / Metric / Chart 선택 UI

type DataSource = 'opportunities' | 'contracts' | 'decisions'
type ChartType = 'bar' | 'pie' | 'line' | 'table'

interface FilterClause {
  id: string
  field: string
  op: 'eq' | 'ne' | 'gt' | 'lt' | 'contains'
  value: string
}

const SOURCE_DEFS: Record<DataSource, { label: string; fields: string[] }> = {
  opportunities: {
    label: 'Opportunities',
    fields: ['stage', 'type', 'probability', 'amount', 'ownerUserId', 'channelId', 'lostReason'],
  },
  contracts: {
    label: 'Contracts',
    fields: ['type', 'status', 'ownerUserId', 'channelId', 'citiBankRef'],
  },
  decisions: {
    label: 'Decisions',
    fields: ['category', 'status', 'decisionByRole', 'requestedByUserId'],
  },
}

const CHART_DEFS: { type: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { type: 'bar', label: 'Bar', icon: BarChart3 },
  { type: 'pie', label: 'Pie', icon: PieChart },
  { type: 'line', label: 'Line', icon: LineChart },
  { type: 'table', label: 'Table', icon: Layers },
]

function getRows(source: DataSource): Record<string, unknown>[] {
  if (source === 'opportunities') return mockOpportunities as unknown as Record<string, unknown>[]
  if (source === 'contracts') return mockContractChanges as unknown as Record<string, unknown>[]
  return mockDecisions as unknown as Record<string, unknown>[]
}

function applyFilter(rows: Record<string, unknown>[], filter: FilterClause): Record<string, unknown>[] {
  if (!filter.field || !filter.value) return rows
  return rows.filter((r) => {
    const val = r[filter.field]
    const v = String(val ?? '').toLowerCase()
    const target = filter.value.toLowerCase()
    switch (filter.op) {
      case 'eq': return v === target
      case 'ne': return v !== target
      case 'gt': return Number(val) > Number(filter.value)
      case 'lt': return Number(val) < Number(filter.value)
      case 'contains': return v.includes(target)
      default: return true
    }
  })
}

function groupAndAggregate(
  rows: Record<string, unknown>[],
  groupByField: string,
  metricField: string,
  metricOp: 'count' | 'sum' | 'avg'
): { key: string; value: number }[] {
  const buckets = new Map<string, number[]>()
  for (const r of rows) {
    const key = String(r[groupByField] ?? '(none)')
    const arr = buckets.get(key) ?? []
    if (metricOp !== 'count') {
      const v = Number(r[metricField])
      if (!isNaN(v)) arr.push(v)
    } else {
      arr.push(1)
    }
    buckets.set(key, arr)
  }
  return Array.from(buckets.entries())
    .map(([key, vals]) => {
      let value = vals.length
      if (metricOp === 'sum') value = vals.reduce((s, x) => s + x, 0)
      if (metricOp === 'avg') value = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0
      return { key, value }
    })
    .sort((a, b) => b.value - a.value)
}

export default function ReportsPage() {
  const [source, setSource] = useState<DataSource>('opportunities')
  const [groupBy, setGroupBy] = useState<string>('stage')
  const [metricOp, setMetricOp] = useState<'count' | 'sum' | 'avg'>('count')
  const [metricField, setMetricField] = useState<string>('amount')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [filters, setFilters] = useState<FilterClause[]>([])

  const sourceDef = SOURCE_DEFS[source]
  const rawRows = useMemo(() => getRows(source), [source])
  const filteredRows = useMemo(() => filters.reduce<Record<string, unknown>[]>((rs, f) => applyFilter(rs, f), rawRows), [rawRows, filters])
  const aggregated = useMemo(
    () => groupAndAggregate(filteredRows, groupBy, metricField, metricOp),
    [filteredRows, groupBy, metricField, metricOp]
  )

  const max = Math.max(1, ...aggregated.map((a) => a.value))
  const total = aggregated.reduce((s, a) => s + a.value, 0)

  // groupBy 값 라벨 매핑 (id → 이름)
  const labelOf = (key: string) => {
    if (groupBy === 'ownerUserId' || groupBy === 'requestedByUserId') {
      return mockUsers.find((u) => u.id === key)?.name ?? key
    }
    if (groupBy === 'channelId') {
      return mockClients.find((c) => c.id === key)?.name ?? key
    }
    return key
  }

  const isCurrencyMetric = metricField === 'amount' && metricOp !== 'count'

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      { id: `f-${Date.now()}`, field: sourceDef.fields[0], op: 'eq', value: '' },
    ])
  }
  const updateFilter = (id: string, patch: Partial<FilterClause>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }
  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id))

  const handleExport = () => {
    exportToCsv(`report-${source}-${groupBy}`, aggregated, [
      { key: (a) => labelOf(a.key), header: groupBy },
      { key: 'value', header: `${metricOp.toUpperCase()}(${metricOp === 'count' ? '*' : metricField})` },
    ])
    toast.success('리포트 CSV 내보내기 완료')
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Custom Report Builder
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            Option C demo
          </span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Salesforce / HubSpot 스타일 ad-hoc 리포트 빌더 — Data Source / Filter / Group By / Metric / Chart 선택
        </p>
      </div>

      {/* Builder Controls */}
      <section className="bg-card border border-border rounded-lg p-4 space-y-4">
        {/* Data Source */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Database className="w-3 h-3" />
            Data Source
          </label>
          <div className="flex gap-1">
            {(Object.keys(SOURCE_DEFS) as DataSource[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSource(s)
                  setGroupBy(SOURCE_DEFS[s].fields[0])
                  setFilters([])
                }}
                className={cn(
                  'h-8 px-3 text-xs rounded-md border',
                  source === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                )}
              >
                {SOURCE_DEFS[s].label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {rawRows.length}건 row · 필터 적용 후 {filteredRows.length}건
          </p>
        </div>

        {/* Filters */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FilterIcon className="w-3 h-3" />
              Filters
            </label>
            <button
              onClick={addFilter}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-border hover:bg-accent"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>
          {filters.length === 0 ? (
            <p className="text-[10px] text-muted-foreground py-2">필터 없음 (전체 row 사용)</p>
          ) : (
            <ul className="space-y-1">
              {filters.map((f) => (
                <li key={f.id} className="flex items-center gap-1 text-xs">
                  <select
                    value={f.field}
                    onChange={(e) => updateFilter(f.id, { field: e.target.value })}
                    className="h-7 rounded border border-input bg-background px-2"
                  >
                    {sourceDef.fields.map((field) => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <select
                    value={f.op}
                    onChange={(e) => updateFilter(f.id, { op: e.target.value as FilterClause['op'] })}
                    className="h-7 rounded border border-input bg-background px-2"
                  >
                    <option value="eq">=</option>
                    <option value="ne">≠</option>
                    <option value="contains">contains</option>
                    <option value="gt">&gt;</option>
                    <option value="lt">&lt;</option>
                  </select>
                  <input
                    value={f.value}
                    onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                    placeholder="값"
                    className="flex-1 h-7 rounded border border-input bg-background px-2"
                  />
                  <button
                    onClick={() => removeFilter(f.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="필터 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Group By + Metric */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Group By
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
            >
              {sourceDef.fields.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Metric
            </label>
            <select
              value={metricOp}
              onChange={(e) => setMetricOp(e.target.value as 'count' | 'sum' | 'avg')}
              className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
            >
              <option value="count">COUNT</option>
              <option value="sum">SUM</option>
              <option value="avg">AVG</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Field {metricOp === 'count' && <span className="text-muted-foreground/50">(N/A)</span>}
            </label>
            <select
              value={metricField}
              onChange={(e) => setMetricField(e.target.value)}
              disabled={metricOp === 'count'}
              className="w-full h-8 rounded border border-input bg-background px-2 text-xs disabled:opacity-50"
            >
              {sourceDef.fields.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Type */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Chart Type
          </label>
          <div className="flex gap-1">
            {CHART_DEFS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={cn(
                  'inline-flex items-center gap-1 h-8 px-3 text-xs rounded-md border',
                  chartType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
            <button
              onClick={handleExport}
              className="ml-auto inline-flex items-center gap-1 h-8 px-3 text-xs rounded-md border border-border hover:bg-accent"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Result Visualization */}
      <section className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">
            결과 — {sourceDef.label} 그룹 by {groupBy}, {metricOp.toUpperCase()}({metricOp === 'count' ? '*' : metricField})
          </h3>
          <span className="text-xs text-muted-foreground">
            {aggregated.length}개 그룹 · 합계 {isCurrencyMetric ? formatCurrency(total) : total.toLocaleString()}
          </span>
        </div>
        {aggregated.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-12">데이터 없음</p>
        ) : chartType === 'table' ? (
          <table className="w-full text-sm">
            <thead className="text-xs">
              <tr className="border-b border-border">
                <th className="text-left py-1.5">{groupBy}</th>
                <th className="text-right py-1.5">{metricOp.toUpperCase()}</th>
                <th className="text-right py-1.5 w-24">%</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((a) => (
                <tr key={a.key} className="border-b border-border/50">
                  <td className="py-1.5 text-xs">{labelOf(a.key)}</td>
                  <td className="py-1.5 text-xs text-right tabular-nums">
                    {isCurrencyMetric ? formatCurrency(a.value) : a.value.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-xs text-right tabular-nums text-muted-foreground">
                    {((a.value / total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : chartType === 'pie' ? (
          <PieView aggregated={aggregated} total={total} labelOf={labelOf} isCurrency={isCurrencyMetric} />
        ) : (
          <BarView aggregated={aggregated} max={max} labelOf={labelOf} isCurrency={isCurrencyMetric} chartType={chartType} />
        )}
      </section>

      <p className="text-[10px] text-muted-foreground">
        ※ Option C demo (2026-04-27): ad-hoc 리포트 빌더. Salesforce Report Builder / HubSpot Custom Report 패턴 참고.
        실제 환경에서는 BFF에서 SQL aggregation으로 처리, 결과 캐싱 (Redis 5분 TTL) 권장.
      </p>
    </div>
  )
}

function BarView({ aggregated, max, labelOf, isCurrency, chartType }: {
  aggregated: { key: string; value: number }[]
  max: number
  labelOf: (k: string) => string
  isCurrency: boolean
  chartType: ChartType
}) {
  return (
    <div className="space-y-2">
      {aggregated.map((a) => {
        const pct = (a.value / max) * 100
        return (
          <div key={a.key} className="flex items-center gap-3">
            <span className="w-32 text-xs truncate shrink-0">{labelOf(a.key)}</span>
            <div className="flex-1 h-6 bg-muted rounded relative overflow-hidden">
              <div
                className={cn(
                  'h-full rounded',
                  chartType === 'line' ? 'bg-primary/40 border-r-2 border-primary' : 'bg-primary/70'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-28 text-xs tabular-nums text-right shrink-0">
              {isCurrency ? formatCurrency(a.value) : a.value.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PieView({ aggregated, total, labelOf, isCurrency }: {
  aggregated: { key: string; value: number }[]
  total: number
  labelOf: (k: string) => string
  isCurrency: boolean
}) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
  let cumulative = 0
  const segments = aggregated.map((a, i) => {
    const startAngle = (cumulative / total) * 360
    cumulative += a.value
    const endAngle = (cumulative / total) * 360
    const color = COLORS[i % COLORS.length]
    return { ...a, startAngle, endAngle, color }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <svg viewBox="0 0 200 200" className="max-w-[300px] mx-auto">
        {segments.map((s) => {
          const a1 = ((s.startAngle - 90) * Math.PI) / 180
          const a2 = ((s.endAngle - 90) * Math.PI) / 180
          const x1 = 100 + 80 * Math.cos(a1)
          const y1 = 100 + 80 * Math.sin(a1)
          const x2 = 100 + 80 * Math.cos(a2)
          const y2 = 100 + 80 * Math.sin(a2)
          const large = s.endAngle - s.startAngle > 180 ? 1 : 0
          return (
            <path
              key={s.key}
              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${large} 1 ${x2} ${y2} Z`}
              fill={s.color}
              stroke="white"
              strokeWidth="1"
            />
          )
        })}
      </svg>
      <ul className="space-y-1.5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded shrink-0" style={{ background: s.color }} />
            <span className="flex-1 truncate">{labelOf(s.key)}</span>
            <span className="tabular-nums">
              {isCurrency ? formatCurrency(s.value) : s.value.toLocaleString()}
            </span>
            <span className="text-muted-foreground tabular-nums w-12 text-right">
              {((s.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
