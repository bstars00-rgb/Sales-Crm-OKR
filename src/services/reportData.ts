/**
 * REPORT 폴더의 실데이터(report_YYYY-MM-DD.json)를 fetch하여 사용.
 * Vite 빌드 시 public/data/*.json 으로 복사된 파일을 런타임에 로드.
 *
 * 데이터 출처: REPORT/output/*.json + REPORT/processed/ytd_accumulator.json
 * Sales CRM 프로토타입은 이 데이터로 KPI / 채널 / 일별 트렌드 / Pipeline / Activity 등을 채움.
 */

import type { Activity } from '@/types'

// ===== Real data shapes (REPORT 시스템 산출물 기반) =====

export interface RealReport {
  period: { start: string; end: string }
  dataBasis: {
    thisWeek: 'Booking Date'
    wow: 'Booking Date'
    mom: 'Check-out Date'
    yoy: 'Check-out Date'
    momPeriod: string
    yoyPeriod: string
  }
  kpi: {
    totalCount: number
    totalRN: number
    totalTTV: number
    totalRevenue: number
    ctripPct: number
    wowCount: number
    wowRN: number
    wowTTV: number
    wowRevenue: number
    wowCtrip: number
  }
  channels: RealChannel[]
  countries: RealCountry[]
  ctrip: {
    ctripPct: number
    chinaPct: number
    top3Pct: number
    top3Detail: { name: string; ttv: number; pct: number }[]
    prevWeek?: {
      ctripPct: number
      chinaPct: number
      top3NonCtripPct: number
    }
  }
  pipeline: RealPipelineRow[]
  pipelineSummary: Record<string, number> // {"①": 0, "②": 7, ...}
  devSchedule: RealDevScheduleRow[]
  contract?: unknown
  decision?: string | unknown
  marketNews?: { macro?: NewsItem[]; competitors?: Record<string, NewsItem[]> }
  teamInput?: {
    teamActions?: TeamActionRow[]
    channelIssue?: TeamActionRow[]
    promo?: unknown[]
    group?: unknown[]
    exception?: unknown[]
  }
  dailyTrend: DailyTrendRow[]
  ytd?: { months?: MonthlyRow[]; channels?: unknown; lastUpdated?: string }
  monthlyCheckout?: { months?: MonthlyRow[] }
  monthlyStats?: unknown
  topHotels?: TopHotelRow[]
  guestOrigin?: Record<string, unknown>
  marginSummary?: unknown
  crosstab?: unknown
}

export interface RealChannel {
  channel: string
  count: number
  rn: number
  ttv: number
  revenue: number
  wowCount: number
  wowRN: number
  wow: number
  wowRevenue: number
}

export interface RealCountry {
  country: string // '일본' | '한국' | '베트남' | ...
  count: number
  rn: number
  ttv: number
  wow: number
  mom?: number
  yoy?: number
}

export interface RealPipelineRow {
  channel: string
  country: string
  stage: '①' | '②' | '③' | '④' | '⑤'
  stageName: string
  pic: string
  type: string
}

export interface RealDevScheduleRow {
  category: string
  project: string
  team?: string
  pic: string
  devOwner: string
  workload?: string
  status: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  note?: string
}

export interface TeamActionRow {
  date?: string
  week?: string
  author: string
  channel: string
  type: string
  content: string
  action: string
  note: string
}

export interface DailyTrendRow {
  date: string
  count: number
  rn: number
  ttv: number
  revenue: number
  dodCount?: number | null
  dodRN?: number | null
  dodTTV?: number | null
  dodRevenue?: number | null
}

export interface MonthlyRow {
  month: string
  count: number
  rn: number
  ttv: number
  revenue: number
  margin?: number
  ctripPct?: number
  chinaPct?: number
  topChannels?: { channel: string; ttv: number; revenue: number; count: number }[]
}

export interface NewsItem {
  title: string
  link: string
  pubDate?: string
  source?: string
  description?: string
}

export interface TopHotelRow {
  hotel: string
  country: string
  ttv: number
  rn: number
  count: number
}

// ===== Loader (Vite Pages base path 호환) =====

const cache: Map<string, RealReport> = new Map()
let ytdCache: unknown = null

/** 테스트 격리용 — 캐시 초기화 (QA-014) */
export function clearReportCache() {
  cache.clear()
  ytdCache = null
}

function withBase(path: string): string {
  // Vite는 import.meta.env.BASE_URL을 자동 주입 (production='/Sales-CRM/', dev='/')
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}

export const AVAILABLE_WEEKS = ['2026-04-04', '2026-04-11', '2026-04-18'] as const
export const LATEST_WEEK = AVAILABLE_WEEKS[AVAILABLE_WEEKS.length - 1]

export async function loadReport(weekDate: string = LATEST_WEEK): Promise<RealReport> {
  if (cache.has(weekDate)) return cache.get(weekDate)!
  const url = withBase(`data/report_${weekDate}.json`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load report ${weekDate}: ${res.status}`)
  const data = (await res.json()) as RealReport
  cache.set(weekDate, data)
  return data
}

export async function loadYtdAccumulator(): Promise<unknown> {
  if (ytdCache) return ytdCache
  const url = withBase('data/ytd_accumulator.json')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ytd_accumulator: ${res.status}`)
  ytdCache = await res.json()
  return ytdCache
}

// ===== Adapters: real data → Sales CRM types =====

const REGION_BY_COUNTRY: Record<string, 'EA' | 'SEA' | 'SA' | 'ME' | 'OC'> = {
  China: 'EA', Korea: 'EA', Japan: 'EA', 'Hong Kong': 'EA', Taiwan: 'EA',
  Thailand: 'SEA', Vietnam: 'SEA', Singapore: 'SEA', Malaysia: 'SEA', Indonesia: 'SEA',
  Philippines: 'SEA', Cambodia: 'SEA',
  India: 'SA', SriLanka: 'SA', Pakistan: 'SA',
  UAE: 'ME', SaudiArabia: 'ME',
  Australia: 'OC', NewZealand: 'OC',
  '한국': 'EA', '일본': 'EA', '중국': 'EA', '대만': 'EA', '홍콩': 'EA',
  '베트남': 'SEA', '태국': 'SEA', '싱가포르': 'SEA', '말레이시아': 'SEA', '인도네시아': 'SEA',
}

function regionOf(country: string): 'EA' | 'SEA' | 'SA' | 'ME' | 'OC' {
  return REGION_BY_COUNTRY[country] ?? 'SEA'
}

const PIC_BY_NAME: Record<string, string> = {
  Ben: 'u-tm', Grace: 'u-grace', Jane: 'u-jane', Jasmine: 'u-jasmine', Sophia: 'u-grace',
}

/**
 * REPORT의 channels[] → Sales CRM의 Channel(목적은 화면 표시).
 * 이미 mocks/clients.ts 가 연락처/계약 등 메타를 갖고 있으므로
 * 이 어댑터는 KPI 갱신용으로 사용 (이름 매칭).
 */
export function buildChannelKPIMap(report: RealReport): Map<string, RealChannel> {
  const m = new Map<string, RealChannel>()
  for (const c of report.channels) {
    m.set(normalizeChannelName(c.channel), c)
  }
  return m
}

function normalizeChannelName(s: string): string {
  return s.toLowerCase().replace(/[\s.\-_]+/g, '')
}

/**
 * 채널명으로 KPI 룩업 (sellerNameAliases 매칭).
 */
export function findChannelKPI(map: Map<string, RealChannel>, name: string, aliases: string[] = []): RealChannel | undefined {
  const candidates = [name, ...aliases].map(normalizeChannelName)
  for (const cand of candidates) {
    if (map.has(cand)) return map.get(cand)
  }
  // partial match
  for (const [key, val] of map) {
    if (candidates.some((c) => key.includes(c) || c.includes(key))) return val
  }
  return undefined
}

/**
 * REPORT teamActions/channelIssue → Sales CRM Activity.
 * 'Date'(예: "April 20-24")는 그 주의 끝 금요일로 추정.
 */
export function teamActionsToActivities(report: RealReport): Activity[] {
  const rows = report.teamInput?.teamActions ?? []
  const acts: Activity[] = []
  const yearHint = parseInt(report.period.end.slice(0, 4), 10) || new Date().getFullYear()
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const author = PIC_BY_NAME[r.author] ?? 'u-tm'
    const channelId = inferChannelId(r.channel)
    const occurredAt = parseTeamWeekToDate(r.date ?? r.week ?? report.period.end, yearHint)
    const type = mapTeamTypeToActivity(r.type)
    // QA-005: 결정론적 ID — 같은 데이터 두 번 로드해도 동일 ID
    const id = `real-${report.period.start}-${i}`
    acts.push({
      id,
      channelId,
      authorUserId: author,
      type,
      occurredAt,
      subject: `${r.channel} — ${r.type}`,
      content: r.content,
      action: r.action,
      note: r.note || undefined,
      source: 'manual',
      createdAt: occurredAt,
      updatedAt: occurredAt,
    })
  }
  return acts.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

function parseTeamWeekToDate(s: string, yearHint = new Date().getFullYear()): string {
  // "April 20-24" → {yearHint}-04-24T17:00:00Z (그 주 금요일 추정)
  const m = s.match(/(\w+)\s*(\d+)\s*[-–~]\s*(\d+)/)
  if (m) {
    const monthName = m[1]
    const endDay = parseInt(m[3], 10)
    const monthIdx = ['January','February','March','April','May','June','July','August','September','October','November','December']
      .findIndex((n) => n.toLowerCase().startsWith(monthName.toLowerCase()))
    if (monthIdx >= 0) {
      const d = new Date(Date.UTC(yearHint, monthIdx, endDay, 17, 0, 0))
      return d.toISOString()
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s + 'T17:00:00Z').toISOString()
  return new Date().toISOString()
}

/**
 * 채널 라벨에서 Channel ID 추정. 미매칭 시 'c-unknown' 반환 + 콘솔 경고 (QA-009).
 */
export function inferChannelId(channelLabel: string): string {
  const lower = channelLabel.toLowerCase()
  if (lower.includes('ctrip') || lower.includes('trip.com')) return 'c2'
  if (lower.includes('agoda')) return 'c-agoda'
  if (lower.includes('klook')) return 'c-klook'
  if (lower.includes('makemy') || lower.includes('mmt')) return 'c-mmt'
  if (lower.includes('traveloka')) return 'c-traveloka'
  if (lower.includes('booking.com')) return 'c-booking'
  if (lower.includes('expedia')) return 'c-expedia'
  if (lower.includes('hanatour')) return 'c1'
  if (lower.includes('jtb')) return 'c3'
  if (lower.includes('tripadvisor')) return 'c-tripadvisor'
  if (lower.includes('gotadi')) return 'c-gotadi'
  // 미매칭 — c-unknown으로 격리하고 경고
  if (typeof console !== 'undefined') {
    console.warn(`[inferChannelId] 미매칭 채널 라벨: "${channelLabel}"`)
  }
  return 'c-unknown'
}

function mapTeamTypeToActivity(type: string): Activity['type'] {
  const lower = type.toLowerCase()
  if (lower.includes('email') || lower.includes('메일')) return 'Email'
  if (lower.includes('call') || lower.includes('콜')) return 'Call'
  if (lower.includes('meeting') || lower.includes('미팅') || lower.includes('회의')) return 'Meeting'
  if (lower.includes('contract') || lower.includes('계약')) return 'Contract'
  if (lower.includes('issue') || lower.includes('이슈') || lower.includes('문제')) return 'Issue'
  if (lower.includes('promo') || lower.includes('프로모션')) return 'Promotion'
  if (lower.includes('visit') || lower.includes('방문')) return 'Visit'
  return 'Note'
}

/**
 * Pipeline ① ~ ⑤ → Sales CRM PipelineStage
 * REPORT 단계명: ① Contact / ② NDA·Contract / ③ In Development / ④ Testing / ⑤ Live
 */
const STAGE_MAP: Record<string, 'Contact' | 'NDA' | 'InDev' | 'Testing' | 'Live'> = {
  '①': 'Contact', '②': 'NDA', '③': 'InDev', '④': 'Testing', '⑤': 'Live',
}

export function adaptPipelineStage(stage: string): 'Contact' | 'NDA' | 'InDev' | 'Testing' | 'Live' {
  return STAGE_MAP[stage] ?? 'Contact'
}

export { regionOf }
