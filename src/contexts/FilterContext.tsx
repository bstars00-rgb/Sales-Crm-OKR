import { createContext, useContext, useState, type ReactNode } from 'react'
import type { GlobalFilters } from '@/types'

// Round 10: 사이드바 필터 재설계 — Tier 제거, 판매 국가 multi-select 추가
// 판매 국가 = 채널/거래처가 위치한 국가 (Channel.country)
export type SalesCountry =
  | 'CN' | 'HK' | 'TW' | 'KR' | 'JP' | 'RU'
  | 'IN' | 'VN' | 'ID' | 'MY' | 'SG'

interface SalesFilters extends GlobalFilters {
  salesCountries: SalesCountry[] // 다중 선택 ([] = 전체)
  pic: string | 'All' // user id
  channelQuery: string
  selectedChannelId: string | null
  favoriteChannels: string[]
}

interface FilterContextType {
  filters: SalesFilters
  setFilters: (f: Partial<SalesFilters>) => void
  resetFilters: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activeFilterCount: number
  toggleFavorite: (channelId: string) => void
  toggleCountry: (code: SalesCountry) => void
}

const DEFAULT_FILTERS: SalesFilters = {
  // legacy 호환
  clients: [],
  countries: [],
  hotels: [],
  regions: [],
  tiers: [],
  dateRange: { start: '2026-01-01', end: '2026-12-31' },
  currency: 'JPY', // 기본 화폐 JPY 고정
  // 신규 (Round 10)
  salesCountries: [],
  pic: 'All',
  channelQuery: '',
  selectedChannelId: null,
  favoriteChannels: [],
}

const FAVORITES_KEY = 'sales-crm:favorite-channels'
const COUNTRIES_KEY = 'sales-crm:sales-countries'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function loadCountries(): SalesCountry[] {
  try {
    const raw = localStorage.getItem(COUNTRIES_KEY)
    return raw ? (JSON.parse(raw) as SalesCountry[]) : []
  } catch {
    return []
  }
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SalesFilters>(() => ({
    ...DEFAULT_FILTERS,
    favoriteChannels: loadFavorites(),
    salesCountries: loadCountries(),
  }))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const setFilters = (partial: Partial<SalesFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...partial }
      // 영속화
      if (partial.favoriteChannels) {
        try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(partial.favoriteChannels)) } catch {}
      }
      if (partial.salesCountries) {
        try { localStorage.setItem(COUNTRIES_KEY, JSON.stringify(partial.salesCountries)) } catch {}
      }
      return next
    })
  }

  const resetFilters = () => {
    setFiltersState({
      ...DEFAULT_FILTERS,
      favoriteChannels: filters.favoriteChannels,
      salesCountries: filters.salesCountries,
    })
  }

  const toggleFavorite = (channelId: string) => {
    setFiltersState((prev) => {
      const current = prev.favoriteChannels
      const next = current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId]
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)) } catch {}
      return { ...prev, favoriteChannels: next }
    })
  }

  const toggleCountry = (code: SalesCountry) => {
    setFiltersState((prev) => {
      const current = prev.salesCountries
      const next = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code]
      try { localStorage.setItem(COUNTRIES_KEY, JSON.stringify(next)) } catch {}
      return { ...prev, salesCountries: next }
    })
  }

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev)

  const activeFilterCount = [
    filters.salesCountries.length > 0,
    filters.pic !== 'All',
    filters.channelQuery.length > 0,
    filters.selectedChannelId !== null,
  ].filter(Boolean).length

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        sidebarCollapsed,
        toggleSidebar,
        activeFilterCount,
        toggleFavorite,
        toggleCountry,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}

// 11개 판매 국가 정의 (UI 라벨 + flag)
export const SALES_COUNTRIES: { code: SalesCountry; label: string; flag: string }[] = [
  { code: 'CN', label: '중국', flag: '🇨🇳' },
  { code: 'HK', label: '홍콩', flag: '🇭🇰' },
  { code: 'TW', label: '대만', flag: '🇹🇼' },
  { code: 'KR', label: '한국', flag: '🇰🇷' },
  { code: 'JP', label: '일본', flag: '🇯🇵' },
  { code: 'RU', label: '러시아', flag: '🇷🇺' },
  { code: 'IN', label: '인도', flag: '🇮🇳' },
  { code: 'VN', label: '베트남', flag: '🇻🇳' },
  { code: 'ID', label: '인도네시아', flag: '🇮🇩' },
  { code: 'MY', label: '말레이시아', flag: '🇲🇾' },
  { code: 'SG', label: '싱가포르', flag: '🇸🇬' },
]
