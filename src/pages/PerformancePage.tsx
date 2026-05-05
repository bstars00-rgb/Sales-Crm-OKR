import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { mockKPI, mockChannelData, mockQuarterData, mockYearlyData } from '@/mocks/kpi'
import { formatCurrency, formatPercent } from '@/utils/kpiCalc'
import KPICascadeCard from '@/components/performance/KPICascadeCard'

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026]

export default function PerformancePage() {
  const [selectedYear, setSelectedYear] = useState(2026)
  const yearData = mockYearlyData[selectedYear]
  const prevYearData = mockYearlyData[selectedYear - 1]

  const yoyChange = prevYearData
    ? ((yearData.ttv - prevYearData.ttv) / prevYearData.ttv) * 100
    : null

  return (
    <div className="w-full space-y-6">
      {/* KPI Cascade L1~L5 (FR-008 placeholder) */}
      <KPICascadeCard />

      {/* Header with Year Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">실적 분석</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">기간 총 TTV</p>
          <p className="text-2xl font-bold">{formatCurrency(yearData.ttv)}</p>
          {selectedYear === 2026 && (
            <p className="text-xs text-muted-foreground mt-1">YTD (Q1)</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">YoY 변화</p>
          <p className={cn(
            'text-2xl font-bold',
            yoyChange !== null && yoyChange >= 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {formatPercent(yoyChange)}
          </p>
          {prevYearData && (
            <p className="text-xs text-muted-foreground mt-1">
              전년: {formatCurrency(prevYearData.ttv)}
            </p>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">채널 믹스</p>
          <div className="flex gap-1 mt-1.5">
            {mockChannelData.map((ch) => (
              <div
                key={ch.channel}
                className={cn(
                  'h-6 rounded-sm flex items-center justify-center text-[10px] font-medium text-white',
                  ch.channel === 'OTA' && 'bg-blue-500',
                  ch.channel === 'API' && 'bg-emerald-500',
                  ch.channel === 'Wholesale' && 'bg-amber-500'
                )}
                style={{ width: `${ch.mixPercent}%` }}
                title={`${ch.channel}: ${ch.mixPercent}%`}
              >
                {ch.mixPercent >= 15 && `${ch.channel} ${ch.mixPercent}%`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Breakdown Table */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">채널별 실적</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">채널</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">TTV</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Revenue</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Room Nights</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Mix %</th>
              </tr>
            </thead>
            <tbody>
              {mockChannelData.map((ch) => (
                <tr key={ch.channel} className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{ch.channel}</td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(ch.ttv)}</td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(ch.revenue)}</td>
                  <td className="px-4 py-2.5 text-right">{ch.roomNights.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">{ch.mixPercent}%</td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-4 py-2.5">합계</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(mockKPI.ttv)}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(mockKPI.revenue)}</td>
                <td className="px-4 py-2.5 text-right">{mockKPI.roomNights.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Quarterly Detail Table */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">분기별 상세</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">기간</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">TTV</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Revenue</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Room Nights</th>
              </tr>
            </thead>
            <tbody>
              {mockQuarterData.map((q) => (
                <Fragment key={q.quarter}>
                  <tr className="border-b border-border bg-muted/20 font-semibold">
                    <td className="px-4 py-2.5">{q.quarter}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(q.totalTTV)}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(q.totalRevenue)}</td>
                    <td className="px-4 py-2.5 text-right">{q.totalRoomNights.toLocaleString()}</td>
                  </tr>
                  {q.months.map((m) => (
                    <tr key={`${q.quarter}-${m.month}`} className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-2 pl-8 text-muted-foreground">{MONTH_NAMES[m.month - 1]}</td>
                      <td className="px-4 py-2 text-right">
                        {m.ttv > 0 ? formatCurrency(m.ttv) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {m.revenue > 0 ? formatCurrency(m.revenue) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {m.roomNights > 0 ? m.roomNights.toLocaleString() : <span className="text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
