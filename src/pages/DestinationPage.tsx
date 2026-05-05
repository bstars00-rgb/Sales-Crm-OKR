import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, AlertTriangle, Lightbulb, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/utils/kpiCalc'
import { mockRegionData, mockCountryData } from '@/mocks/destinations'

type SortKey = 'country' | 'region' | 'ttv' | 'roomNights' | 'growth'
type SortDir = 'asc' | 'desc'

export default function DestinationPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('ttv')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const maxTTV = Math.max(...mockRegionData.map((r) => r.ttv))

  const filteredCountries = useMemo(() => {
    let data = [...mockCountryData]
    if (selectedRegion) {
      data = data.filter((c) => c.region === selectedRegion)
    }
    data.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
    return data
  }, [selectedRegion, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-foreground" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-foreground" />
    )
  }

  const regionColors: Record<string, string> = {
    'East Asia': 'bg-blue-500',
    'SE Asia': 'bg-emerald-500',
    'South Asia': 'bg-amber-500',
    'Middle East': 'bg-purple-500',
    Oceania: 'bg-cyan-500',
  }

  const regionTextColors: Record<string, string> = {
    'East Asia': 'text-blue-600',
    'SE Asia': 'text-emerald-600',
    'South Asia': 'text-amber-600',
    'Middle East': 'text-purple-600',
    Oceania: 'text-cyan-600',
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">목적지 분석</h1>
          <p className="text-sm text-muted-foreground">지역별 / 국가별 TTV 및 성장률 분석</p>
        </div>
      </div>

      {/* Region Bar Chart */}
      <section className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">지역별 TTV</h2>
          {selectedRegion && (
            <button
              onClick={() => setSelectedRegion(null)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              전체 보기
            </button>
          )}
        </div>
        <div className="space-y-3">
          {mockRegionData.map((region) => {
            const widthPercent = (region.ttv / maxTTV) * 100
            const isSelected = selectedRegion === region.region
            const isFiltered = selectedRegion !== null && !isSelected
            return (
              <button
                key={region.region}
                onClick={() => setSelectedRegion(isSelected ? null : region.region)}
                className={cn(
                  'w-full text-left group transition-opacity',
                  isFiltered && 'opacity-40'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-sm font-medium', isSelected && regionTextColors[region.region])}>
                    {region.region}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatCurrency(region.ttv)}</span>
                    <span className="text-emerald-600 font-medium">{formatPercent(region.growth)}</span>
                  </div>
                </div>
                <div className="w-full h-7 bg-muted/50 rounded-md overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-md transition-all',
                      regionColors[region.region],
                      isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'
                    )}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Country Data Table */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold">
            국가별 상세 데이터
            {selectedRegion && (
              <span className={cn('ml-2 text-xs font-normal px-2 py-0.5 rounded-full', regionTextColors[selectedRegion], 'bg-muted')}>
                {selectedRegion}
              </span>
            )}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {[
                  { key: 'country' as SortKey, label: '국가' },
                  { key: 'region' as SortKey, label: '지역' },
                  { key: 'ttv' as SortKey, label: 'TTV' },
                  { key: 'roomNights' as SortKey, label: 'Room Nights' },
                  { key: 'growth' as SortKey, label: '성장률' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none',
                      col.key === 'ttv' || col.key === 'roomNights' || col.key === 'growth'
                        ? 'text-right'
                        : ''
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon column={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((c, idx) => (
                <tr
                  key={c.country}
                  className={cn('border-b last:border-b-0 hover:bg-muted/20 transition-colors', idx % 2 === 0 ? 'bg-white' : 'bg-muted/10')}
                >
                  <td className="px-4 py-3 font-medium">
                    <span className="mr-2">{c.flag}</span>
                    {c.country}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', regionTextColors[c.region], 'bg-muted/60')}>
                      {c.region}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(c.ttv)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{c.roomNights.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        c.growth >= 15 ? 'text-emerald-600' : c.growth >= 10 ? 'text-blue-600' : 'text-muted-foreground'
                      )}
                    >
                      {formatPercent(c.growth)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Insights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold">성장 트렌드 예측</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            베트남과 뉴질랜드가 20% 이상 성장률을 보이며 핵심 성장 시장으로 부상 중입니다.
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold">리스크 분석</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            중국 시장 성장률 5.8%로 둔화. 현지 규제 변화 모니터링 필요.
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold">액션 추천</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SE Asia 지역 집중 투자 권장. 전년 대비 14.2% 성장으로 가장 높은 성장률.
          </p>
        </div>
      </section>
    </div>
  )
}
