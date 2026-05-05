import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PanelLeftClose, PanelLeftOpen, RotateCcw, Search,
  Globe, User as UserIcon, Building2, X, Bookmark, ChevronDown, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters, SALES_COUNTRIES, type SalesCountry } from '@/contexts/FilterContext'
import { mockClients } from '@/mocks/clients'
import { SALES_PICS } from '@/mocks/users'

export default function Sidebar() {
  const {
    filters, setFilters, resetFilters,
    sidebarCollapsed, toggleSidebar, activeFilterCount,
    toggleFavorite, toggleCountry,
  } = useFilters()
  const [showChannelResults, setShowChannelResults] = useState(false)

  // 채널 검색 (Tier 표시 제거)
  const channelResults = useMemo(() => {
    if (!filters.channelQuery.trim()) return []
    const q = filters.channelQuery.toLowerCase()
    return mockClients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [filters.channelQuery])

  const favoriteChannelObjects = useMemo(
    () => mockClients.filter((c) => filters.favoriteChannels.includes(c.id)),
    [filters.favoriteChannels]
  )

  const selectedChannel = filters.selectedChannelId
    ? mockClients.find((c) => c.id === filters.selectedChannelId)
    : null

  // ─── Collapsed mode ───
  if (sidebarCollapsed) {
    return (
      <aside className="w-12 bg-card border-r border-border flex flex-col items-center pt-3 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
        <button
          onClick={toggleSidebar}
          className="relative p-2 rounded-md hover:bg-accent transition-colors"
          title="필터 열기"
          aria-label="필터 열기"
        >
          <PanelLeftOpen className="w-5 h-5 text-muted-foreground" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </aside>
    )
  }

  // ─── Expanded mode ───
  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold flex items-center gap-1.5">
          채널 필터
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </span>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          title="필터 닫기"
          aria-label="필터 닫기"
        >
          <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground px-4 pt-3 leading-relaxed">
        Period · 통계 필터는 Overview 페이지에서 설정합니다.
      </p>

      <div className="flex flex-col gap-5 px-4 py-4">
        {/* 1. 판매 국가 (검색 가능 multi-select dropdown) */}
        <Section icon={Globe} title="판매 국가" badge={filters.salesCountries.length > 0 ? `${filters.salesCountries.length}개` : undefined}>
          <CountryDropdown
            selected={filters.salesCountries}
            onToggle={toggleCountry}
            onClear={() => setFilters({ salesCountries: [] })}
          />
        </Section>

        {/* 2. 담당 PIC */}
        <Section icon={UserIcon} title="담당 PIC">
          <select
            value={filters.pic}
            onChange={(e) => setFilters({ pic: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="PIC 필터"
          >
            <option value="All">전체 ({SALES_PICS.length}명)</option>
            {SALES_PICS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.country})
              </option>
            ))}
          </select>
        </Section>

        {/* 3. 채널 검색 */}
        <Section icon={Building2} title="채널 검색">
          {selectedChannel ? (
            <div className="flex items-center gap-1 border rounded-md px-2 py-1.5 bg-primary/10">
              <span className="text-xs font-medium truncate flex-1">{selectedChannel.name}</span>
              <button
                onClick={() => setFilters({ selectedChannelId: null, channelQuery: '' })}
                aria-label="선택 채널 해제"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={filters.channelQuery}
                  onChange={(e) => {
                    setFilters({ channelQuery: e.target.value })
                    setShowChannelResults(true)
                  }}
                  onFocus={() => setShowChannelResults(true)}
                  placeholder="채널명 입력..."
                  aria-label="채널 검색"
                  className="w-full pl-7 pr-3 h-8 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {showChannelResults && channelResults.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto border rounded-md divide-y">
                  {channelResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setFilters({ selectedChannelId: c.id, channelQuery: '' })
                        setShowChannelResults(false)
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-primary/10 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="font-medium truncate">{c.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(c.id)
                        }}
                        className="shrink-0 text-muted-foreground hover:text-amber-500"
                        aria-label="북마크 토글"
                      >
                        <Bookmark
                          className={cn(
                            'w-3 h-3',
                            filters.favoriteChannels.includes(c.id) && 'fill-amber-500 text-amber-500'
                          )}
                        />
                      </button>
                    </button>
                  ))}
                </div>
              )}
              {showChannelResults && filters.channelQuery && channelResults.length === 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground text-center py-2 border rounded-md">
                  검색 결과 없음
                </p>
              )}
            </>
          )}
        </Section>

        {/* 4. 북마크 (즐겨찾기 채널) */}
        <Section
          icon={Bookmark}
          title="북마크"
          badge={favoriteChannelObjects.length > 0 ? `${favoriteChannelObjects.length}` : undefined}
        >
          {favoriteChannelObjects.length === 0 ? (
            <p className="text-[10px] text-muted-foreground py-2">
              채널 검색 시 ⭐ 아이콘으로 북마크 추가
            </p>
          ) : (
            <ul className="space-y-1">
              {favoriteChannelObjects.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent group"
                >
                  <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                  <button
                    onClick={() => setFilters({ selectedChannelId: c.id })}
                    className="flex-1 text-left truncate"
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    aria-label={`${c.name} 북마크 해제`}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          필터 초기화
        </button>
      </div>
    </aside>
  )
}

// 검색 가능 멀티 선택 국가 드롭다운
function CountryDropdown({
  selected,
  onToggle,
  onClear,
}: {
  selected: SalesCountry[]
  onToggle: (code: SalesCountry) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  // outside click 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SALES_COUNTRIES
    return SALES_COUNTRIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors',
          open && 'ring-2 ring-ring'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">국가 선택...</span>
          ) : (
            <>
              <span className="text-base leading-none">
                {selected.slice(0, 3).map((c) => SALES_COUNTRIES.find((s) => s.code === c)?.flag).join(' ')}
                {selected.length > 3 && ' …'}
              </span>
              <span className="text-xs text-muted-foreground">{selected.length}개</span>
            </>
          )}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="relative border-b border-border">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="국가명 또는 코드 검색..."
              className="w-full pl-7 pr-3 h-9 bg-transparent text-xs focus:outline-none"
            />
          </div>

          {/* Selected count + Clear all */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30 text-[10px]">
              <span className="text-muted-foreground">{selected.length}개 선택됨</span>
              <button
                onClick={() => { onClear(); }}
                className="text-primary hover:underline"
              >
                전체 해제
              </button>
            </div>
          )}

          {/* Country List */}
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-muted-foreground text-center">
                검색 결과 없음
              </li>
            ) : (
              filtered.map((c) => {
                const isSelected = selected.includes(c.code)
                return (
                  <li key={c.code} role="option" aria-selected={isSelected}>
                    <button
                      onClick={() => onToggle(c.code)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                      )}
                    >
                      <span className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0 bg-background">
                        {isSelected && <Check className="w-3 h-3 text-primary" />}
                      </span>
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="flex-1">{c.label}</span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">{c.code}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Globe
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80 mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1">{title}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            {badge}
          </span>
        )}
      </label>
      {children}
    </section>
  )
}
