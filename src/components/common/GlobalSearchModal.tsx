import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Search, X, Building2, Activity as ActivityIcon, ListChecks,
  FileSignature, Users, ChevronRight, Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useActivityStore } from '@/contexts/ActivityStore'
import { mockClients } from '@/mocks/clients'
import { mockUsers } from '@/mocks/users'
import { ROLE_LABELS } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSelectChannel?: (channelId: string) => void
}

type SearchKind = 'channel' | 'activity' | 'task' | 'user'

interface SearchResult {
  kind: SearchKind
  id: string
  title: string
  subtitle: string
  href?: string
  channelId?: string
  taskId?: string
  activityId?: string
}

const RECENT_KEY = 'sales-crm:recent-search'
const MAX_RECENT = 5

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveRecent(query: string) {
  if (!query.trim()) return
  const list = loadRecent().filter((q) => q !== query)
  list.unshift(query)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
}

const KIND_META: Record<SearchKind, { label: string; icon: typeof Building2; color: string }> = {
  channel: { label: '채널', icon: Building2, color: 'text-blue-600 dark:text-blue-400' },
  activity: { label: 'Activity', icon: ActivityIcon, color: 'text-violet-600 dark:text-violet-400' },
  task: { label: 'Task', icon: ListChecks, color: 'text-amber-600 dark:text-amber-400' },
  user: { label: '사용자', icon: Users, color: 'text-emerald-600 dark:text-emerald-400' },
}

export default function GlobalSearchModal({ open, onClose, onSelectChannel }: Props) {
  const navigate = useNavigate()
  const { user, getAccessibleClientIds } = useAuth()
  const { activities, tasks } = useActivityStore()
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 모달 열림 시 input 포커스 + recent 갱신
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setRecent(loadRecent())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // PIC 격리 헬퍼 (BR-016-3)
  const accessibleIds = useMemo(() => getAccessibleClientIds(), [getAccessibleClientIds])
  const canAccessChannel = (channelId: string) => accessibleIds === 'all' || accessibleIds.includes(channelId)

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const out: SearchResult[] = []

    // Channels (모든 사용자 표시, 편집 권한은 격리)
    for (const c of mockClients) {
      const matches =
        c.name.toLowerCase().includes(q) ||
        (c.country ?? '').toLowerCase().includes(q) ||
        (c.sellerNameAliases ?? []).some((a) => a.toLowerCase().includes(q))
      if (matches) {
        const accessible = canAccessChannel(c.id)
        out.push({
          kind: 'channel',
          id: c.id,
          title: c.name,
          subtitle: `${c.country ?? '—'} · ${c.region}${accessible ? '' : ' · 조회 전용'}`,
          channelId: c.id,
        })
      }
    }

    // Activities (PIC 접근 가능 채널만)
    for (const a of activities) {
      if (!canAccessChannel(a.channelId)) continue
      if (
        a.subject.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
      ) {
        const channel = mockClients.find((c) => c.id === a.channelId)
        out.push({
          kind: 'activity',
          id: a.id,
          title: a.subject,
          subtitle: `${channel?.name ?? a.channelId} · ${a.type}`,
          channelId: a.channelId,
          activityId: a.id,
        })
      }
    }

    // Tasks (본인 등록만)
    for (const t of tasks) {
      if (t.ownerUserId !== user?.id) continue
      if (t.title.toLowerCase().includes(q)) {
        out.push({
          kind: 'task',
          id: t.id,
          title: t.title,
          subtitle: `${t.category} · #${t.rank} · ${t.status}`,
          taskId: t.id,
          channelId: t.channelId,
        })
      }
    }

    // Users (전체)
    for (const u of mockUsers) {
      if (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      ) {
        out.push({
          kind: 'user',
          id: u.id,
          title: u.name,
          subtitle: `${ROLE_LABELS[u.role]} · ${u.email}`,
        })
      }
    }

    // 카테고리별 최대 5개
    const grouped: Record<SearchKind, SearchResult[]> = {
      channel: [], activity: [], task: [], user: [],
    }
    for (const r of out) {
      if (grouped[r.kind].length < 5) grouped[r.kind].push(r)
    }
    return [
      ...grouped.channel,
      ...grouped.activity,
      ...grouped.task,
      ...grouped.user,
    ]
  }, [query, activities, tasks, user, accessibleIds])

  const handleSelect = (r: SearchResult) => {
    saveRecent(query)
    if (r.kind === 'channel' && r.channelId && onSelectChannel) {
      onSelectChannel(r.channelId)
      onClose()
      return
    }
    if (r.kind === 'channel') {
      navigate('/crm')
    } else if (r.kind === 'activity' && r.channelId) {
      navigate('/crm')
    } else if (r.kind === 'task') {
      navigate('/briefing')
    } else if (r.kind === 'user') {
      navigate('/')
    }
    onClose()
  }

  // 키보드 네비
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(results.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const r = results[activeIndex]
        if (r) handleSelect(r)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, activeIndex, results, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            placeholder="채널 / Activity / Task / 사용자 검색..."
            aria-label="글로벌 검색"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded border border-border bg-muted text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results / Recent */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query.trim() && recent.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">최근 검색</p>
              <ul className="space-y-1">
                {recent.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => setQuery(q)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm flex items-center gap-2"
                    >
                      <Search className="w-3 h-3 text-muted-foreground" />
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!query.trim() && recent.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground space-y-1">
              <Command className="w-8 h-8 mx-auto opacity-30" />
              <p>채널, Activity, Task, 사용자를 검색하세요</p>
              <p className="text-[10px]">↑↓ 탐색 / Enter 선택 / Esc 닫기</p>
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p>"{query}" 검색 결과 없음</p>
            </div>
          )}

          {query.trim() && results.length > 0 && (
            <ResultGroupList
              results={results}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              onHover={(i) => setActiveIndex(i)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 rounded bg-background border border-border">↑↓</kbd>
              이동
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 rounded bg-background border border-border">Enter</kbd>
              선택
            </span>
          </div>
          <span>{results.length > 0 ? `${results.length}개 결과` : ''}</span>
        </div>
      </div>
    </div>
  )
}

function ResultGroupList({
  results, activeIndex, onSelect, onHover,
}: {
  results: SearchResult[]
  activeIndex: number
  onSelect: (r: SearchResult) => void
  onHover: (i: number) => void
}) {
  // Group by kind, preserve order
  const groups: Record<SearchKind, SearchResult[]> = { channel: [], activity: [], task: [], user: [] }
  results.forEach((r) => groups[r.kind].push(r))

  let runningIndex = 0
  const sections: { kind: SearchKind; items: { result: SearchResult; index: number }[] }[] = []
  for (const kind of ['channel', 'activity', 'task', 'user'] as SearchKind[]) {
    if (groups[kind].length === 0) continue
    const items = groups[kind].map((r) => ({ result: r, index: runningIndex++ }))
    sections.push({ kind, items })
  }

  return (
    <div>
      {sections.map(({ kind, items }) => {
        const meta = KIND_META[kind]
        const Icon = meta.icon
        return (
          <div key={kind} className="border-b border-border last:border-b-0">
            <div className="px-3 py-1.5 flex items-center gap-1.5 bg-muted/30">
              <Icon className={cn('w-3 h-3', meta.color)} />
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">{meta.label}</span>
              <span className="text-[10px] text-muted-foreground/70">({items.length})</span>
            </div>
            <ul>
              {items.map(({ result: r, index }) => (
                <li key={r.kind + r.id}>
                  <button
                    onClick={() => onSelect(r)}
                    onMouseEnter={() => onHover(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-left text-sm',
                      activeIndex === index ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5 shrink-0', meta.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
