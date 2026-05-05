import { useState, useMemo } from 'react'
import { TrendingUp, Tag, Zap, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/utils/kpiCalc'
import { mockTrendData, mockEvents, mockChannelStats } from '@/mocks/trends'

type RangePreset = '7d' | '30d' | '90d' | '1y'

const CHANNEL_COLORS = {
  ota: { bar: 'bg-blue-500', text: 'text-blue-600', dot: 'bg-blue-500' },
  api: { bar: 'bg-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  wholesale: { bar: 'bg-amber-500', text: 'text-amber-600', dot: 'bg-amber-500' },
}

const EVENT_TYPE_STYLES = {
  promotion: { bg: 'bg-pink-100 text-pink-700', label: '프로모션' },
  system: { bg: 'bg-blue-100 text-blue-700', label: '시스템' },
  market: { bg: 'bg-amber-100 text-amber-700', label: '시장' },
}

export default function TrendsPage() {
  const [activeRange, setActiveRange] = useState<RangePreset>('1y')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const maxTotal = useMemo(
    () => Math.max(...mockTrendData.map((m) => m.ota + m.api + m.wholesale)),
    []
  )

  const selectedEvent = mockEvents.find((e) => e.id === selectedEventId)

  // Simulate before/after data for selected event
  const beforeAfter = useMemo(() => {
    if (!selectedEvent) return null
    const monthIdx = parseInt(selectedEvent.date.split('-')[1]) - 1
    const before = mockTrendData[Math.max(0, monthIdx - 1)]
    const after = mockTrendData[Math.min(mockTrendData.length - 1, monthIdx)]
    if (!before || !after) return null
    const beforeTotal = before.ota + before.api + before.wholesale
    const afterTotal = after.ota + after.api + after.wholesale
    const change = ((afterTotal - beforeTotal) / beforeTotal) * 100
    return {
      beforeTotal,
      afterTotal,
      change,
      beforeOta: before.ota,
      afterOta: after.ota,
      beforeApi: before.api,
      afterApi: after.api,
      beforeWholesale: before.wholesale,
      afterWholesale: after.wholesale,
    }
  }, [selectedEvent])

  const rangePresets: { key: RangePreset; label: string }[] = [
    { key: '7d', label: '7일' },
    { key: '30d', label: '30일' },
    { key: '90d', label: '90일' },
    { key: '1y', label: '1년' },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">트렌드 분석</h1>
          <p className="text-sm text-muted-foreground">채널별 Room Nights 추이 및 이벤트 영향 분석</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <section className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {rangePresets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => setActiveRange(preset.key)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeRange === preset.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" defaultValue="2025-01-01" className="border rounded-md px-2 py-1.5 text-sm" />
            <span className="text-muted-foreground">~</span>
            <input type="date" defaultValue="2025-12-31" className="border rounded-md px-2 py-1.5 text-sm" />
          </div>
        </div>
      </section>

      {/* Trend Chart */}
      <section className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold">월별 Room Nights 추이 (2025)</h2>
          <div className="flex items-center gap-4">
            {Object.entries(CHANNEL_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('w-2.5 h-2.5 rounded-full', val.dot)} />
                <span className="text-xs text-muted-foreground uppercase">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-64">
          {mockTrendData.map((month) => {
            const total = month.ota + month.api + month.wholesale
            const heightPercent = (total / maxTotal) * 100
            const otaPercent = (month.ota / total) * 100
            const apiPercent = (month.api / total) * 100
            const wholesalePercent = (month.wholesale / total) * 100
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground font-mono">{total.toLocaleString()}</div>
                <div className="w-full relative" style={{ height: `${heightPercent}%` }}>
                  <div className="absolute inset-0 flex flex-col rounded-t-md overflow-hidden">
                    <div className={CHANNEL_COLORS.ota.bar} style={{ height: `${otaPercent}%` }} />
                    <div className={CHANNEL_COLORS.api.bar} style={{ height: `${apiPercent}%` }} />
                    <div className={CHANNEL_COLORS.wholesale.bar} style={{ height: `${wholesalePercent}%` }} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{month.month}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Event Markers + Before/After */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Event List */}
        <section className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">이벤트 마커</h2>
          </div>
          <div className="space-y-2">
            {mockEvents.map((evt) => {
              const style = EVENT_TYPE_STYLES[evt.type]
              const isSelected = selectedEventId === evt.id
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventId(isSelected ? null : evt.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-transparent hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', style.bg)}>{style.label}</span>
                    <span className="text-xs text-muted-foreground">{evt.date}</span>
                  </div>
                  <div className="text-sm font-medium">{evt.name}</div>
                  <p className="text-xs text-muted-foreground mt-1">{evt.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Before/After Analysis */}
        <section className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Before / After 분석</h2>
          </div>
          {selectedEvent && beforeAfter ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-foreground">{selectedEvent.name}</div>
              <div className="text-xs text-muted-foreground">Before 7일 vs After 7일 비교</div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">전체</div>
                  <div className="text-lg font-semibold">{beforeAfter.afterTotal.toLocaleString()}</div>
                  <div className={cn('text-xs font-medium mt-1', beforeAfter.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {formatPercent(beforeAfter.change)}
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Before</div>
                  <div className="text-lg font-semibold">{beforeAfter.beforeTotal.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">After</div>
                  <div className="text-lg font-semibold">{beforeAfter.afterTotal.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {(['ota', 'api', 'wholesale'] as const).map((ch) => {
                  const beforeVal = beforeAfter[`before${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof typeof beforeAfter] as number
                  const afterVal = beforeAfter[`after${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof typeof beforeAfter] as number
                  const chg = beforeVal ? ((afterVal - beforeVal) / beforeVal) * 100 : 0
                  return (
                    <div key={ch} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', CHANNEL_COLORS[ch].dot)} />
                        <span className="uppercase text-xs font-medium">{ch}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{beforeVal.toLocaleString()} → {afterVal.toLocaleString()}</span>
                        <span className={cn('text-xs font-medium', chg >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {formatPercent(chg)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">이벤트를 선택하면 Before/After 비교를 확인할 수 있습니다.</p>
            </div>
          )}
        </section>
      </div>

      {/* Channel Stats Table */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold">채널별 통계</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">채널</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Room Nights</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">점유율</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">성장률</th>
            </tr>
          </thead>
          <tbody>
            {mockChannelStats.map((ch) => (
              <tr key={ch.channel} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        ch.channel === 'OTA' ? CHANNEL_COLORS.ota.dot : ch.channel === 'API' ? CHANNEL_COLORS.api.dot : CHANNEL_COLORS.wholesale.dot
                      )}
                    />
                    {ch.channel}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{ch.roomNights.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-xs">{ch.share.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('text-xs font-medium', ch.growth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {formatPercent(ch.growth)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
