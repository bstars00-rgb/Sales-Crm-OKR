import { useEffect, useState } from 'react'
import { Plus, Check, Circle, AlertCircle, RotateCcw, X, Trash2, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useActivityStore } from '@/contexts/ActivityStore'
import { mockClients } from '@/mocks/clients'
import { toast } from 'sonner'
import type { TaskCategory } from '@/types'

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  NewDeal: '신규 채널',
  Promotion: '프로모션',
  Issue: '이슈 대응',
  Contract: '계약',
  Pipeline: 'Pipeline',
  Internal: '내부',
  'Follow-up': 'Follow-up',
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  NewDeal: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Promotion: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Issue: 'bg-red-500/10 text-red-600 dark:text-red-400',
  Contract: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Pipeline: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Internal: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'Follow-up': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
}

const CATEGORY_OPTIONS: TaskCategory[] = [
  'NewDeal', 'Promotion', 'Issue', 'Contract', 'Pipeline', 'Internal', 'Follow-up',
]

export default function Critical6Section() {
  const { user } = useAuth()
  const { tasks, addTask, addBulkCarryOver, removeTask, toggleTaskDone, updateTask, getTasksByOwner } = useActivityStore()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10)

  const myTasks = user ? getTasksByOwner(user.id, today).sort((a, b) => a.rank - b.rank) : []
  const yesterdayUnfinished = user ? getTasksByOwner(user.id, yesterday).filter((t) => t.status !== 'Done') : []

  const [showAddForm, setShowAddForm] = useState(false)
  const [draft, setDraft] = useState<{ title: string; expectedOutcome: string; category: TaskCategory; channelId?: string }>({
    title: '',
    expectedOutcome: '',
    category: 'NewDeal',
  })
  const dismissKey = user ? `sales-crm:carryover-dismissed:${user.id}:${today}` : ''
  const [carryOverPromptOpen, setCarryOverPromptOpen] = useState(false)

  // 어제 미완료 carry-over 프롬프트 (BR-002-6 a/b/c 옵션 + PL-R3-007 dismiss 영속화)
  useEffect(() => {
    if (!user) return
    const dismissed = localStorage.getItem(dismissKey) === '1'
    if (!dismissed && yesterdayUnfinished.length > 0 && !yesterdayUnfinished.some((t) => t.carryOver)) {
      setCarryOverPromptOpen(true)
    }
  }, [yesterdayUnfinished.length, yesterdayUnfinished, user, dismissKey])

  const dismissCarryOverPrompt = () => {
    setCarryOverPromptOpen(false)
    if (dismissKey) localStorage.setItem(dismissKey, '1')
  }

  const handleCarryOverAddToday = (taskId: string) => {
    const t = yesterdayUnfinished.find((x) => x.id === taskId)
    if (!t || !user) return
    if (myTasks.length >= 6) {
      toast.error('Critical 6은 최대 6개까지')
      return
    }
    addTask({
      ownerUserId: user.id,
      date: today,
      channelId: t.channelId,
      category: t.category,
      title: t.title,
      expectedOutcome: t.expectedOutcome,
      status: 'Planned',
      carryOver: true,
    })
    updateTask(taskId, { carryOver: true })
    toast.success(`${t.title} 오늘로 이월`)
  }

  const handleCarryOverSkip = (taskId: string, reason?: string) => {
    updateTask(taskId, { status: 'Skipped', resultNote: reason ?? '미완료 → 오늘 스킵' })
    toast(`${taskId} Skipped 처리`)
  }

  const handleCarryOverDelete = (taskId: string) => {
    removeTask(taskId)
    toast('삭제됨')
  }

  // Cmd+N 단축키 (FR-016 / AC-002-5) — input/textarea 포커스 시 무시 (PL-R2-009)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isFormElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !isFormElement) {
        e.preventDefault()
        if (myTasks.length < 6) setShowAddForm(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [myTasks.length])

  // Done/InProgress 토글 + 회수 toast 분기 (PL-R3-002)
  const handleToggleTask = (taskId: string) => {
    const t = myTasks.find((x) => x.id === taskId)
    if (!t) return
    const wasDone = t.status === 'Done'
    toggleTaskDone(taskId)
    if (wasDone) {
      // Done → InProgress 회수 분기
      const lastAutoId = t.doneActivityIds?.[t.doneActivityIds.length - 1]
      const recentlyCreated = lastAutoId
        ? Date.now() - new Date(t.doneAt ?? t.updatedAt).getTime() < 5 * 60 * 1000
        : false
      if (recentlyCreated) {
        toast.info('Done 해제 — 자동 생성 Activity가 함께 회수됨', { description: '5분 이내 토글' })
      } else {
        toast('Done 해제 — 5분 경과: 자동 Activity는 보존됩니다 (수동 삭제 필요)')
      }
    } else {
      toast.success(`Task 완료: ${t.title}`, { description: 'Activity 자동 생성됨' })
    }
  }

  const doneCount = myTasks.filter((t) => t.status === 'Done').length
  const carryOverCount = myTasks.filter((t) => t.carryOver).length

  const handleAdd = () => {
    if (!user) return
    if (!draft.title.trim()) return toast.error('제목을 입력하세요')
    const result = addTask({
      ownerUserId: user.id,
      date: today,
      channelId: draft.channelId,
      category: draft.category,
      title: draft.title,
      expectedOutcome: draft.expectedOutcome || undefined,
      status: 'Planned',
    })
    if (!result) return toast.error('Critical 6은 최대 6개까지')
    setDraft({ title: '', expectedOutcome: '', category: 'NewDeal' })
    setShowAddForm(false)
    toast.success('Critical 6에 추가됨')
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            Critical 6
            <span className="text-xs font-normal text-muted-foreground">
              {doneCount}/{myTasks.length} 완료 · 최대 6개
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">⌘N</kbd>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            오늘의 최우선 작업. 완료 시 Activity 자동 생성 → 주간보고에 자동 반영.
          </p>
        </div>
        {carryOverCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
            <RotateCcw className="w-3 h-3" />
            오늘 이월 {carryOverCount}건
          </span>
        )}
      </div>

      {/* Carry-over prompt — 어제 미완료 (BR-002-6 a/b/c 옵션 + 일괄 처리) */}
      {carryOverPromptOpen && yesterdayUnfinished.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              어제 미완료 Task {yesterdayUnfinished.length}건 처리
            </h4>
            <button
              onClick={dismissCarryOverPrompt}
              aria-label="이월 안내 닫기 (오늘 다시 표시 안 함)"
              title="오늘은 다시 표시하지 않습니다"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* 일괄 처리 버튼 (PL-R2-001 + TS3-003 원자성) */}
          {yesterdayUnfinished.length > 1 && (
            <div className="flex gap-1.5 mb-2 pb-2 border-b border-amber-500/20">
              <button
                onClick={() => {
                  const result = addBulkCarryOver(yesterdayUnfinished.map((t) => t.id))
                  if (result.skipped > 0) {
                    toast.warning(`${result.added}건 이월, ${result.skipped}건은 6개 한도 초과로 스킵됨`)
                  } else {
                    toast.success(`${result.added}건 오늘로 이월됨`)
                  }
                }}
                disabled={myTasks.length >= 6}
                className="px-2 py-1 rounded text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                모두 +오늘 ({yesterdayUnfinished.length})
              </button>
              <button
                onClick={() => yesterdayUnfinished.forEach((t) => handleCarryOverSkip(t.id))}
                className="px-2 py-1 rounded text-[10px] border border-border hover:bg-accent"
              >
                모두 Skip
              </button>
              <button
                onClick={() => {
                  // PL-R3-004: 파괴적 일괄 작업 confirm
                  if (!window.confirm(`어제 미완료 ${yesterdayUnfinished.length}건 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
                  yesterdayUnfinished.forEach((t) => handleCarryOverDelete(t.id))
                }}
                className="px-2 py-1 rounded text-[10px] text-destructive hover:bg-destructive/10"
              >
                모두 삭제
              </button>
            </div>
          )}
          <ul className="space-y-1.5">
            {yesterdayUnfinished.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate">
                  #{t.rank} {t.title}
                </span>
                <button
                  onClick={() => handleCarryOverAddToday(t.id)}
                  className="px-2 py-0.5 rounded text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                  title="오늘 추가"
                >
                  +오늘
                </button>
                <button
                  onClick={() => handleCarryOverSkip(t.id)}
                  className="px-2 py-0.5 rounded text-[10px] border border-border hover:bg-accent inline-flex items-center gap-0.5"
                  title="Skipped"
                >
                  <SkipForward className="w-3 h-3" />
                  Skip
                </button>
                <button
                  onClick={() => handleCarryOverDelete(t.id)}
                  className="px-2 py-0.5 rounded text-[10px] text-destructive hover:bg-destructive/10 inline-flex items-center gap-0.5"
                  title="삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-2">
        {myTasks.map((t) => (
          <li
            key={t.id}
            className={cn(
              'group flex items-start gap-3 p-3 rounded-lg border transition-colors',
              t.status === 'Done'
                ? 'bg-muted/40 border-border/50'
                : 'bg-background border-border hover:border-foreground/30'
            )}
          >
            <button
              onClick={() => handleToggleTask(t.id)}
              aria-label={`${t.title} 완료 토글`}
              className={cn(
                'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0',
                t.status === 'Done'
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-border hover:border-primary'
              )}
            >
              {t.status === 'Done' ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3 opacity-0" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">#{t.rank}</span>
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium', CATEGORY_COLORS[t.category])}>
                  {CATEGORY_LABELS[t.category]}
                </span>
                {t.channelId && (
                  <span className="text-xs text-muted-foreground">
                    → {mockClients.find((c) => c.id === t.channelId)?.name ?? t.channelId}
                  </span>
                )}
                {t.carryOver && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3 h-3" /> 이월
                  </span>
                )}
                {t.status === 'Done' && t.doneActivityIds && t.doneActivityIds.length > 0 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    ✓ Activity 생성됨
                  </span>
                )}
              </div>
              <div
                className={cn(
                  'text-sm font-medium mt-1',
                  t.status === 'Done' && 'line-through text-muted-foreground'
                )}
              >
                {t.title}
              </div>
              {t.expectedOutcome && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  예상 결과: {t.expectedOutcome}
                </div>
              )}
            </div>

            <button
              onClick={() => removeTask(t.id)}
              aria-label={`${t.title} 삭제`}
              className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 focus-visible:opacity-100 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Add form */}
      {showAddForm ? (
        <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Task 제목 (예: Trip.com Q2 프로모션 미팅)"
            aria-label="Task 제목"
            className="w-full px-3 py-2 rounded-md text-sm bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={draft.expectedOutcome}
            onChange={(e) => setDraft({ ...draft, expectedOutcome: e.target.value })}
            placeholder="예상 결과 (선택)"
            aria-label="예상 결과"
            className="w-full px-3 py-2 rounded-md text-sm bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as TaskCategory })}
              aria-label="카테고리"
              className="px-3 py-1.5 rounded-md text-xs bg-background border border-border"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={draft.channelId ?? ''}
              onChange={(e) => setDraft({ ...draft, channelId: e.target.value || undefined })}
              aria-label="채널"
              className="flex-1 px-3 py-1.5 rounded-md text-xs bg-background border border-border"
            >
              <option value="">— 채널 선택 (선택) —</option>
              {mockClients.slice(0, 30).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              추가
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (myTasks.length >= 6) {
              toast.error('Critical 6은 최대 6개까지 등록 가능합니다')
              return
            }
            setShowAddForm(true)
          }}
          disabled={myTasks.length >= 6}
          aria-label="Critical Task 추가"
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border-2 border-dashed',
            myTasks.length >= 6
              ? 'border-border text-muted-foreground/50 cursor-not-allowed'
              : 'border-border hover:border-primary hover:text-primary text-muted-foreground'
          )}
        >
          <Plus className="w-4 h-4" />
          {myTasks.length >= 6 ? '6개 모두 등록됨' : `Critical Task 추가 (${myTasks.length}/6) — ⌘N`}
        </button>
      )}
    </div>
  )
}
