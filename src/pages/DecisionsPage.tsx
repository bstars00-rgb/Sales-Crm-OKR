import { useMemo, useState } from 'react'
import { Plus, Sparkles, Clock, CheckCircle2, PauseCircle, Eye, Download } from 'lucide-react'
import { exportToCsv } from '@/utils/csvExport'
import { cn } from '@/lib/utils'
import { mockDecisions, decisionStats } from '@/mocks/decisions'
import { mockUsers } from '@/mocks/users'
import { useAuth } from '@/contexts/AuthContext'
import type { DecisionCategory, DecisionStatus, DecisionRequest } from '@/types'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  Pricing: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  Contract: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  Resource: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Strategy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
}

const STATUS_LABELS: Record<DecisionStatus, string> = {
  Open: '대기',
  UnderReview: '검토중',
  Decided: '결정완료',
  Deferred: '보류',
}

const STATUS_COLORS: Record<DecisionStatus, string> = {
  Open: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  UnderReview: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  Decided: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Deferred: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function DecisionsPage() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'All'>('All')
  const [categoryFilter, setCategoryFilter] = useState<DecisionCategory | 'All'>('All')
  const [decideOpen, setDecideOpen] = useState<DecisionRequest | null>(null)

  const filtered = useMemo(() => {
    return mockDecisions.filter((d) => {
      if (statusFilter !== 'All' && d.status !== statusFilter) return false
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false
      return true
    })
  }, [statusFilter, categoryFilter])

  const stats = decisionStats()
  const role = user?.role
  const isManagerOrAbove = role === 'team_manager' || role === 'director' || role === 'regional_director' || role === 'c_level' || role === 'ceo'
  const canDecide = (req: DecisionRequest) => {
    if (req.decisionByRole === 'ceo') return role === 'ceo' || role === 'c_level'
    return role === 'director' || role === 'regional_director' || role === 'c_level' || role === 'ceo'
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          의사결정 요청
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          FR-014 · Manager가 요청, Director/CEO가 결정 · Weekly Brief에서 첨부
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Clock} label="대기" value={stats.open} color="amber" />
        <Stat icon={Eye} label="검토중" value={stats.underReview} color="blue" />
        <Stat icon={CheckCircle2} label="결정완료" value={stats.decided} color="emerald" />
        <Stat icon={PauseCircle} label="보류" value={stats.deferred} color="slate" />
      </section>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="상태 필터"
        >
          <option value="All">전체 상태</option>
          {(Object.keys(STATUS_LABELS) as DecisionStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="카테고리 필터"
        >
          <option value="All">전체 카테고리</option>
          {(Object.keys(CATEGORY_COLORS) as DecisionCategory[]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => {
            exportToCsv('decisions', filtered, [
              { key: 'id', header: 'ID' },
              { key: 'title', header: 'Title' },
              { key: 'category', header: 'Category' },
              { key: 'status', header: 'Status' },
              { key: 'decisionByRole', header: 'DecisionByRole' },
              { key: (d) => mockUsers.find((u) => u.id === d.requestedByUserId)?.name ?? d.requestedByUserId, header: 'RequestedBy' },
              { key: 'createdAt', header: 'CreatedAt' },
              { key: 'decidedAt', header: 'DecidedAt' },
              { key: 'decision', header: 'Decision' },
              { key: 'decisionNote', header: 'DecisionNote' },
              { key: (d) => d.options.join(' | '), header: 'Options' },
            ])
            toast.success(`${filtered.length}건 CSV 내보내기 완료`)
          }}
          className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
          title="CSV로 내보내기"
        >
          <Download className="w-4 h-4" /> Export
        </button>
        {isManagerOrAbove && (
          <button
            onClick={() => toast.info('의사결정 요청 모달 (Phase 2)')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> 요청 추가
          </button>
        )}
      </div>

      {/* Decision List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-12 text-center text-sm text-muted-foreground">
          매칭되는 의사결정 요청 없음
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((d) => {
            const requester = mockUsers.find((u) => u.id === d.requestedByUserId)
            const days = daysAgo(d.createdAt)
            const isOverdue = d.status === 'Open' && days >= 5
            return (
              <li
                key={d.id}
                className={cn(
                  'bg-card border-l-4 rounded-lg p-4 hover:shadow-md transition-shadow',
                  CATEGORY_COLORS[d.category].split(' ').find((c) => c.startsWith('border-')) ?? 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', CATEGORY_COLORS[d.category])}>
                        {d.category}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', STATUS_COLORS[d.status])}>
                        {STATUS_LABELS[d.status]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                        {d.decisionByRole === 'ceo' ? 'CEO 결정' : 'Director 결정'}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-600 dark:text-red-400">
                          ⚠ 5일+ 미결정
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm">{d.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{d.detail}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="mt-3 space-y-1">
                  {d.options.map((opt, i) => {
                    const isPicked = d.decision === opt
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2 text-xs px-2 py-1.5 rounded border',
                          isPicked
                            ? 'border-emerald-500/40 bg-emerald-500/10 font-medium'
                            : 'border-border bg-background'
                        )}
                      >
                        <span className="text-muted-foreground tabular-nums w-4">{String.fromCharCode(65 + i)}.</span>
                        <span className="flex-1">{opt}</span>
                        {isPicked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div>
                    요청: {requester?.name ?? '-'} · {days}일 전
                    {d.status === 'Decided' && d.decisionNote && (
                      <p className="mt-1 text-foreground">📝 {d.decisionNote}</p>
                    )}
                  </div>
                  {(d.status === 'Open' || d.status === 'UnderReview') && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => canDecide(d) ? setDecideOpen(d) : toast.error('이 의사결정은 ' + (d.decisionByRole === 'ceo' ? 'CEO' : 'Director') + ' 이상 권한입니다')}
                        disabled={!canDecide(d)}
                        className={cn(
                          'h-7 px-3 text-[11px] rounded border',
                          canDecide(d)
                            ? 'border-primary text-primary hover:bg-primary/10'
                            : 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                        )}
                      >
                        Decide
                      </button>
                      <button
                        onClick={() => toast.info(`${d.id} 보류 처리 (Mock)`)}
                        className="h-7 px-3 text-[11px] rounded border border-border text-muted-foreground hover:bg-accent"
                      >
                        Defer
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Decide Modal */}
      {decideOpen && (
        <DecideModal req={decideOpen} onClose={() => setDecideOpen(null)} />
      )}
    </div>
  )
}

function Stat({
  icon: Icon, label, value, color,
}: {
  icon: typeof Clock
  label: string
  value: number
  color: 'amber' | 'blue' | 'emerald' | 'slate'
}) {
  const colorMap = {
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    slate: 'text-slate-600 dark:text-slate-400',
  }
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn('w-4 h-4', colorMap[color])} />
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', colorMap[color])}>{value}</p>
    </div>
  )
}

function DecideModal({ req, onClose }: { req: DecisionRequest; onClose: () => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const submit = () => {
    if (!picked) {
      toast.error('옵션을 선택하세요')
      return
    }
    if (!note.trim()) {
      toast.error('decisionNote는 필수입니다')
      return
    }
    toast.success(`${req.id} 결정 완료: ${picked} (Mock)`)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold mb-3">의사결정: {req.title}</h3>
        <p className="text-xs text-muted-foreground mb-4">{req.detail}</p>
        <div className="space-y-2 mb-4">
          {req.options.map((opt) => (
            <label
              key={opt}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm',
                picked === opt ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
              )}
            >
              <input
                type="radio"
                checked={picked === opt}
                onChange={() => setPicked(opt)}
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="결정 사유 (필수)"
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 text-sm rounded-md border border-border hover:bg-accent">
            취소
          </button>
          <button onClick={submit} className="h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            결정 확정
          </button>
        </div>
      </div>
    </div>
  )
}
