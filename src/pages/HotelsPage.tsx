import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Copy, Building2, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/utils/kpiCalc'
import { mockHotelRanking } from '@/mocks/hotels'
import { toast } from 'sonner'

type SortKey = 'rank' | 'name' | 'grade' | 'ttv' | 'roomNights' | 'yoyGrowth' | 'momGrowth' | 'wowGrowth' | 'rankChange'
type SortDir = 'asc' | 'desc'

function GrowthCell({ value }: { value: number }) {
  return (
    <span className={cn('text-xs font-medium', value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-500' : 'text-muted-foreground')}>
      {formatPercent(value)}
    </span>
  )
}

function RankChangeCell({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <ChevronUp className="w-3.5 h-3.5" />
        {value}
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
        <ChevronDown className="w-3.5 h-3.5" />
        {Math.abs(value)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Minus className="w-3.5 h-3.5" />
    </span>
  )
}

const gradeStyles: Record<string, string> = {
  '5-Star': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Luxury: 'bg-purple-50 text-purple-700 border-purple-200',
  '4-Star': 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function HotelsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'rank' ? 'asc' : 'desc')
    }
  }

  const sorted = [...mockHotelRanking].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  function handleCopy() {
    const header = 'Rank\tHotel\tLocation\tGrade\tTTV\tRoom Nights\tYoY\tMoM\tWoW\tRank Change'
    const rows = sorted.map(
      (h) =>
        `${h.rank}\t${h.name}\t${h.location}, ${h.country}\t${h.grade}\t${h.ttv}\t${h.roomNights}\t${h.yoyGrowth}%\t${h.momGrowth}%\t${h.wowGrowth}%\t${h.rankChange}`
    )
    navigator.clipboard.writeText([header, ...rows].join('\n'))
    toast.success('데이터가 클립보드에 복사되었습니다')
  }

  function handleRowClick() {
    toast.info('호텔 상세 모달 (준비 중)')
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-foreground" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-foreground" />
    )
  }

  const columns: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'rank', label: '#' },
    { key: 'name', label: '호텔명' },
    { key: 'grade', label: '등급' },
    { key: 'ttv', label: 'TTV', align: 'right' },
    { key: 'roomNights', label: 'Room Nights', align: 'right' },
    { key: 'yoyGrowth', label: 'YoY', align: 'right' },
    { key: 'momGrowth', label: 'MoM', align: 'right' },
    { key: 'wowGrowth', label: 'WoW', align: 'right' },
    { key: 'rankChange', label: '순위 변동', align: 'right' },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">호텔 랭킹</h1>
            <p className="text-sm text-muted-foreground">Top 20 호텔 성과 분석</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border bg-white hover:bg-muted/50 transition-colors"
        >
          <Copy className="w-4 h-4" />
          복사
        </button>
      </div>

      {/* Hotel Table */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap',
                      col.align === 'right' ? 'text-right' : 'text-left'
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
              {sorted.map((hotel, idx) => (
                <tr
                  key={hotel.rank}
                  onClick={handleRowClick}
                  className={cn(
                    'border-b last:border-b-0 hover:bg-blue-50/40 cursor-pointer transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                  )}
                >
                  <td className="px-4 py-3 font-semibold text-muted-foreground w-10">{hotel.rank}</td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{hotel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {hotel.location}, {hotel.country}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', gradeStyles[hotel.grade])}>
                      {hotel.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(hotel.ttv)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{hotel.roomNights.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <GrowthCell value={hotel.yoyGrowth} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GrowthCell value={hotel.momGrowth} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GrowthCell value={hotel.wowGrowth} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RankChangeCell value={hotel.rankChange} />
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
