import { useEffect, useMemo, useState } from 'react'
import {
  Activity, Briefcase, Building2, Clock, Globe, MapPin, RefreshCw, TrendingUp,
  Plane, Users, AlertCircle, ChevronRight, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockCityData, type CityData } from '@/mocks/livemap'

const REGION_COLORS: Record<string, { bg: string; text: string; border: string; icon: string; ring: string; hex: string }> = {
  'East Asia': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', icon: '🇰🇷', ring: 'ring-blue-400', hex: '#3b82f6' },
  'SE Asia': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', icon: '🇸🇬', ring: 'ring-emerald-400', hex: '#10b981' },
  'South Asia': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', icon: '🇮🇳', ring: 'ring-orange-400', hex: '#f97316' },
  'Middle East': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', icon: '🇦🇪', ring: 'ring-purple-400', hex: '#a855f7' },
  'Oceania': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30', icon: '🇦🇺', ring: 'ring-cyan-400', hex: '#06b6d4' },
}

const REGION_NAME_KO: Record<string, string> = {
  'East Asia': '동아시아',
  'SE Asia': '동남아시아',
  'South Asia': '남아시아',
  'Middle East': '중동',
  'Oceania': '오세아니아',
}

/**
 * 이미지 viewport 기준 좌표 변환.
 * 이미지의 실제 지리 범위 (눈으로 측정):
 * - 좌측: 인도(75°E) ~ 우측: 일본 동단(150°E)
 * - 상단: 몽골/중국 북부(50°N) ~ 하단: 인도네시아 발리 남쪽(-12°S)
 */
function toMapPosition(lat: number, lng: number) {
  const minLng = 70
  const maxLng = 152
  const minLat = -12
  const maxLat = 52
  const x = ((lng - minLng) / (maxLng - minLng)) * 100
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100
  return {
    left: `${Math.max(2, Math.min(98, x))}%`,
    top: `${Math.max(2, Math.min(98, y))}%`,
  }
}

/** 마커 크기 — recentBookings 기반 (8~28px) */
function markerSize(recentBookings: number, max: number) {
  const min = 10
  const maxSize = 28
  const ratio = max > 0 ? recentBookings / max : 0
  return Math.round(min + (maxSize - min) * Math.sqrt(ratio))
}

export default function LiveMapPage() {
  const [refreshTick, setRefreshTick] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null)
  const [filterRegion, setFilterRegion] = useState<string | 'all'>('all')

  // 자동 갱신 30초
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshTick((t) => t + 1)
      setLastUpdate(new Date())
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  // 동아시아/동남아시아 위주의 도시만 (이미지 viewport 안에 들어오는 도시)
  const visibleCities = useMemo(() => {
    return mockCityData.filter((c) => {
      // 이미지 범위 내만 표시
      if (c.lng < 70 || c.lng > 152) return false
      if (c.lat < -12 || c.lat > 52) return false
      if (filterRegion !== 'all' && c.region !== filterRegion) return false
      return true
    })
  }, [filterRegion])

  const maxBookings = useMemo(() => {
    return Math.max(0, ...visibleCities.map((c) => c.recentBookings))
  }, [visibleCities])

  // KPI
  const totalBookings = 128_745
  const activeCities = visibleCities.length
  const realtimeRate = 2_847 + (refreshTick % 50)
  const dod = 18.6

  const regionSummary = useMemo(() => {
    const map = new Map<string, { ttv: number; rn: number; cities: number; bookings: number }>()
    for (const c of mockCityData) {
      const cur = map.get(c.region) ?? { ttv: 0, rn: 0, cities: 0, bookings: 0 }
      cur.ttv += c.ttv
      cur.rn += c.roomNights
      cur.cities += 1
      cur.bookings += c.recentBookings
      map.set(c.region, cur)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].ttv - a[1].ttv)
  }, [])

  const top10 = useMemo(
    () => [...mockCityData].sort((a, b) => b.recentBookings - a.recentBookings).slice(0, 10),
    []
  )
  const top10Max = top10[0]?.recentBookings ?? 1
  const totalActivity = mockCityData.reduce((s, c) => s + c.recentBookings, 0)

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">아시아 도시별 실시간 예약</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            도시별 예약 발생 현황 실시간 시각화 · 마지막 업데이트{' '}
            {lastUpdate.toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}{' '}(KST)
          </p>
        </div>
        <button
          onClick={() => { setRefreshTick((t) => t + 1); setLastUpdate(new Date()) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 새로고침
        </button>
      </div>

      {/* KPI Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={Briefcase} label="전체 예약건 (오늘)" value={totalBookings.toLocaleString()} delta={`▲ ${dod}% (전일 대비)`} positive />
        <KPI icon={Building2} label="활성 도시" value={activeCities.toString()} delta="▲ 1 (전일 대비)" positive />
        <KPI icon={Activity} label="실시간 예약 / 분" value={realtimeRate.toLocaleString()} delta="▲ 15.3% (전일 동시간)" positive />
        <KPI icon={Plane} label="해외 도시 비중" value="78%" delta="▲ 4.2%p (전일 대비)" positive />
      </section>

      {/* Hero (인터랙티브 지도) + Side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 인터랙티브 지도 */}
        <section className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">아시아 실시간 예약 분포</h3>
              <span className="text-[10px] text-muted-foreground">
                · 마커 클릭 → 상세
              </span>
            </div>
            {/* 권역 필터 */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setFilterRegion('all')}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded border',
                  filterRegion === 'all'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                )}
              >
                전체 ({mockCityData.filter(c => c.lng >= 70 && c.lng <= 152 && c.lat >= -12 && c.lat <= 52).length})
              </button>
              {(['East Asia', 'SE Asia'] as const).map((r) => {
                const colors = REGION_COLORS[r]
                const count = mockCityData.filter((c) => c.region === r && c.lng >= 70 && c.lng <= 152 && c.lat >= -12 && c.lat <= 52).length
                return (
                  <button
                    key={r}
                    onClick={() => setFilterRegion(r)}
                    className={cn(
                      'px-2 py-0.5 text-[10px] rounded border',
                      filterRegion === r
                        ? `${colors.bg} ${colors.text} ${colors.border} font-semibold`
                        : 'border-border hover:bg-accent text-muted-foreground'
                    )}
                  >
                    {colors.icon} {REGION_NAME_KO[r]} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Map container — Claude AI 생성 SVG 다크 배경 (이미지 미사용) */}
          <div className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 aspect-[16/9] overflow-hidden">
            <MapBackground />

            {/* 도시 마커 */}
                {visibleCities.map((c) => {
                  const pos = toMapPosition(c.lat, c.lng)
                  const size = markerSize(c.recentBookings, maxBookings)
                  const colors = REGION_COLORS[c.region]
                  const isSelected = selectedCity?.name === c.name
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCity((prev) => (prev?.name === c.name ? null : c))}
                      onMouseEnter={() => setHoveredCity(c)}
                      onMouseLeave={() => setHoveredCity(null)}
                      style={{
                        left: pos.left,
                        top: pos.top,
                        width: size,
                        height: size,
                        backgroundColor: colors.hex,
                      }}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 rounded-full',
                        'border-2 border-white/80 shadow-lg',
                        'hover:scale-125 transition-transform cursor-pointer',
                        'before:absolute before:inset-0 before:rounded-full before:animate-ping before:opacity-50',
                        isSelected && 'ring-4 ring-white scale-125',
                      )}
                      title={`${c.nameKo} · ${c.recentBookings}건`}
                      aria-label={`${c.nameKo} 도시 마커, 최근 예약 ${c.recentBookings}건`}
                    >
                      <span className="sr-only">{c.nameKo}</span>
                    </button>
                  )
                })}

                {/* Hover Tooltip */}
                {hoveredCity && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: toMapPosition(hoveredCity.lat, hoveredCity.lng).left,
                      top: toMapPosition(hoveredCity.lat, hoveredCity.lng).top,
                      transform: 'translate(-50%, calc(-100% - 18px))',
                    }}
                  >
                    <div className="bg-slate-900/95 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap border border-white/20 shadow-xl">
                      <div className="font-semibold">{hoveredCity.nameKo}</div>
                      <div className="text-[10px] opacity-80">
                        {hoveredCity.country} · {hoveredCity.recentBookings.toLocaleString()}건
                      </div>
                    </div>
                  </div>
                )}

                {/* LIVE 배지 */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </div>

                {/* 범례 */}
                <div className="absolute bottom-3 left-3 z-10 bg-black/50 backdrop-blur rounded-md px-3 py-2 text-[10px] text-white">
                  <div className="font-semibold mb-1">예약건 (오늘)</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 border border-white/50" />
                    <span>적음</span>
                    <div className="flex items-center gap-0.5">
                      <span>→</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-blue-500 border border-white/50" />
                    <span>많음</span>
                  </div>
                </div>
          </div>

          {/* 선택된 도시 상세 패널 */}
          {selectedCity && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: REGION_COLORS[selectedCity.region].hex }}
                    />
                    <h4 className="text-sm font-semibold">{selectedCity.nameKo}</h4>
                    <span className="text-xs text-muted-foreground">{selectedCity.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {REGION_NAME_KO[selectedCity.region]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                    <Stat label="실시간 예약" value={selectedCity.recentBookings.toLocaleString()} />
                    <Stat label="TTV (YTD)" value={`¥${(selectedCity.ttv / 1_000_000_000).toFixed(1)}B`} />
                    <Stat label="Room Nights" value={`${(selectedCity.roomNights / 1000).toFixed(0)}K`} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  aria-label="상세 닫기"
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Top 10 Cities */}
        <section className="bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">예약건 TOP 10 (오늘)</h3>
          </div>
          <ul className="p-3 space-y-2">
            {top10.map((c, i) => {
              const pct = (c.recentBookings / top10Max) * 100
              return (
                <li key={c.name} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0',
                      i < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCity(c)
                      setFilterRegion('all')
                    }}
                    className="text-xs font-medium truncate w-16 shrink-0 text-left hover:text-primary"
                  >
                    {c.nameKo}
                  </button>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-14 text-right">
                    {c.recentBookings.toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="px-4 py-2.5 border-t border-border">
            <button
              onClick={() => setFilterRegion('all')}
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs border border-border hover:bg-accent"
            >
              전체 도시 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </section>
      </div>

      {/* 권역별 + 인사이트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">권역별 분포</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regionSummary.map(([region, data]) => {
              const colors = REGION_COLORS[region]
              return (
                <button
                  key={region}
                  onClick={() => setFilterRegion(filterRegion === region ? 'all' : region)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-all hover:shadow-md',
                    colors.bg,
                    colors.border,
                    filterRegion === region && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{colors.icon}</span>
                    <h4 className={cn('text-xs font-semibold', colors.text)}>
                      {REGION_NAME_KO[region]}
                    </h4>
                  </div>
                  <div className="text-lg font-bold">
                    {(data.ttv / 1_000_000_000).toFixed(1)}B
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{data.cities}개 도시</span>
                    <span>예약 {data.bookings}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">주요 인사이트 (오늘)</h3>
          </div>
          <div className="p-3 space-y-2.5">
            <Insight
              icon={TrendingUp}
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-500/10"
              title="도쿄 예약건 가장 높음"
              detail="전일 대비 22.4% 증가"
            />
            <Insight
              icon={Plane}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
              title="해외 도시 예약 비중 78%"
              detail="전일 대비 ▲ 4.2%p"
            />
            <Insight
              icon={Clock}
              color="text-violet-600 dark:text-violet-400"
              bg="bg-violet-500/10"
              title="피크 시간대"
              detail="19:00 ~ 22:00"
            />
            <Insight
              icon={Users}
              color="text-cyan-600 dark:text-cyan-400"
              bg="bg-cyan-500/10"
              title={`총 활성 예약 ${totalActivity.toLocaleString()}건`}
              detail={`${mockCityData.length}개 도시 합산 (최근 1시간)`}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function KPI({
  icon: Icon, label, value, delta, positive,
}: {
  icon: typeof Briefcase
  label: string
  value: string
  delta: string
  positive?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p
        className={cn(
          'text-[10px] mt-1',
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
        )}
      >
        {delta}
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function Insight({
  icon: Icon, color, bg, title, detail,
}: {
  icon: typeof TrendingUp
  color: string
  bg: string
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg border border-border">
      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('w-3.5 h-3.5', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  )
}

/**
 * Claude AI 생성 SVG 다크 지도 배경 — 이미지 의존성 제거.
 * 점선 그리드 + 동심원 ping + 권역별 발광 영역으로 "실시간 분포" 시각 효과.
 */
function MapBackground() {
  return (
    <>
      {/* 발광 그라디언트 — 권역별 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* East Asia (오른쪽 위) */}
        <div className="absolute rounded-full blur-3xl opacity-40" style={{ left: '60%', top: '10%', width: '35%', height: '50%', backgroundColor: '#3b82f6' }} />
        {/* SE Asia (가운데 아래) */}
        <div className="absolute rounded-full blur-3xl opacity-30" style={{ left: '20%', top: '50%', width: '45%', height: '50%', backgroundColor: '#10b981' }} />
        {/* South Asia (왼쪽) */}
        <div className="absolute rounded-full blur-3xl opacity-25" style={{ left: '0%', top: '15%', width: '30%', height: '40%', backgroundColor: '#f97316' }} />
      </div>

      {/* 점선 그리드 패턴 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.6)" />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>

      {/* 위경도 라벨 (장식용) */}
      <div className="absolute top-2 right-3 text-[9px] text-slate-500/60 pointer-events-none font-mono">
        <div>50°N</div>
        <div className="mt-[20%]">30°N</div>
        <div className="mt-[20%]">10°N</div>
        <div className="mt-[20%]">10°S</div>
      </div>
      <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[9px] text-slate-500/60 pointer-events-none font-mono">
        <span>70°E</span>
        <span>90°E</span>
        <span>110°E</span>
        <span>130°E</span>
        <span>150°E</span>
      </div>

      {/* 동심원 ping (중앙 발산 효과) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-cyan-400/30 animate-ping" style={{ animationDuration: '4s' }} />
      </div>
    </>
  )
}
