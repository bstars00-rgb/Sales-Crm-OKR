import { useEffect, useMemo, useState } from 'react'
import {
  Sun, Plus, GripVertical, X, Calendar as CalendarIcon, AlertTriangle,
  Star, Heart, Send, Save, ArrowRight, Users, Clock, CheckCircle2, ChevronDown, Palette, Smile, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  mockCritical6Tasks, getTodayTasksByUser, getCarryOverCandidates,
  C6_STATUS_DEFS, IMPORTANCE_LABELS,
} from '@/mocks/critical6'
import { mockClients } from '@/mocks/clients'
import { mockUsers } from '@/mocks/users'
import type { Task, TaskStatus, TaskRank, TaskImportance, TaskCategory, TaskCardColor } from '@/types'
import { TASK_CARD_COLOR_PALETTE, TASK_EMOJI_PRESETS } from '@/types'
import { useOkr } from '@/contexts/OkrContext'
import { Target as TargetIcon, Link2 } from 'lucide-react'
import { toast } from 'sonner'

// Critical 6 PRD v1.4 (Round 16) — 6개 제한 해제 + 꾸미기 / 애착 형성
// 권장 6개 (강제 X) + 우선순위 드래그 + 5단계 상태 + 색상/이모지/하트 옵션

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  NewDeal: '신규 거래',
  Promotion: '프로모션',
  Issue: '이슈 대응',
  Contract: '계약',
  Pipeline: '파이프라인',
  Internal: '내부 업무',
  'Follow-up': 'Follow-up',
}

function todayKST(): string {
  return new Date().toISOString().split('T')[0]
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Critical6Page() {
  const { user } = useAuth()
  // 데모 fallback: mock Task가 있는 sales user로 (Sprint 1 demo). 실제 ProD에서는 user.id 그대로.
  const realUserId = user?.id ?? 'u-sales-1'
  const hasTasks = getTodayTasksByUser(realUserId).length > 0
  const userId = hasTasks ? realUserId : 'u-sales-1' // demo: 빈 user는 sales-1 데이터로 진입

  // 오늘 Task state (mock에서 로드 후 로컬 mutation)
  const [tasks, setTasks] = useState<Task[]>(() => getTodayTasksByUser(userId))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverRank, setDragOverRank] = useState<TaskRank | null>(null)
  const [carryOverDismissed, setCarryOverDismissed] = useState(false)
  const [collaboratorOpenId, setCollaboratorOpenId] = useState<string | null>(null)

  // 사용자 변경 시 Task 다시 로드
  useEffect(() => {
    setTasks(getTodayTasksByUser(userId))
  }, [userId])

  const carryOverCandidates = useMemo(
    () => getCarryOverCandidates(userId).filter((t) => !tasks.some((x) => x.carriedOverFrom === t.id)),
    [userId, tasks]
  )

  const filledCount = tasks.length
  const emptySlots = 6 - filledCount

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'Done').length
    const inProgress = tasks.filter((t) => t.status === 'InProgress').length
    const blocked = tasks.filter((t) => t.status === 'Blocked').length
    return { done, inProgress, blocked, completionRate: tasks.length > 0 ? done / tasks.length : 0 }
  }, [tasks])

  // ==== Drag-drop ====
  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragEnd = () => { setDraggingId(null); setDragOverRank(null) }

  const handleDrop = (toRank: TaskRank) => {
    if (!draggingId) return
    const movedTask = tasks.find((t) => t.id === draggingId)
    if (!movedTask || movedTask.rank === toRank) {
      handleDragEnd()
      return
    }
    setTasks((prev) => {
      const without = prev.filter((t) => t.id !== draggingId)
      const inserted = [...without]
      // toRank 위치에 삽입 후 rank 재계산
      const arr = inserted.sort((a, b) => a.rank - b.rank)
      const newOrder = arr.filter((t) => t.rank < toRank).concat(
        { ...movedTask, rank: toRank },
        arr.filter((t) => t.rank >= toRank)
      ).slice(0, 6)
      return newOrder.map((t, i) => ({ ...t, rank: (i + 1) as TaskRank }))
    })
    handleDragEnd()
  }

  // ==== Mutations ====
  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
    )
  }

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id).map((t, i) => ({ ...t, rank: (i + 1) as TaskRank })))
    toast.info('업무 삭제')
  }

  const addTask = (preset?: Partial<Task>) => {
    // Round 16: 6개 제한 해제 — 권장 6개이지만 무제한 추가 가능
    const nextRank = (filledCount + 1) as TaskRank
    const now = new Date().toISOString()
    const newTask: Task = {
      id: `task-new-${Date.now()}`,
      ownerUserId: userId,
      date: todayKST(),
      rank: nextRank,
      category: 'NewDeal',
      title: preset?.title ?? '',
      status: 'Planned',
      importance: 2,
      collaborators: [],
      carryCount: 0,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      ...preset,
    }
    setTasks((prev) => [...prev, newTask])
    if (filledCount + 1 > 6) {
      toast.info(`${filledCount + 1}번째 task 추가 — 권장 6개를 넘었어요 ✨`, { duration: 3000 })
    }
  }

  const importCarryOver = (sourceTask: Task) => {
    // Round 16: carry-over도 무제한
    addTask({
      title: sourceTask.title,
      description: sourceTask.description,
      category: sourceTask.category,
      importance: sourceTask.importance ?? 2,
      channelId: sourceTask.channelId,
      carriedOverFrom: sourceTask.id,
      carryCount: (sourceTask.carryCount ?? 0) + 1,
      status: 'Planned',
    })
    toast.success(`이월: "${sourceTask.title}"`)
  }

  const handleSubmit = () => {
    if (filledCount === 0) {
      toast.error('최소 1개 항목 작성 후 제출하세요')
      return
    }
    toast.success(`${filledCount}개 Critical 6 제출 완료 (Mock)`, {
      description: '팀 대시보드에 자동 노출됩니다',
    })
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" />
            Critical 6 — 오늘의 핵심 ✨
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
              꾸미기 v1.4
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {todayKST()} ({['일','월','화','수','목','금','토'][new Date().getDay()]}) ·{' '}
            <span className="font-semibold">
              {filledCount}개 작성
              {filledCount > 0 && filledCount <= 6 && <span className="text-pink-500"> · 권장 6개</span>}
              {filledCount > 6 && <span className="text-violet-500"> · 권장 +{filledCount - 6}개 ✨</span>}
            </span> ·{' '}
            완료 {stats.done} · 진행 {stats.inProgress} · Blocked {stats.blocked}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (tasks.length > 0 && !confirm(`현재 ${tasks.length}개 업무를 모두 지우고 빈 보드로 시작합니다.\n계속하시겠습니까? (시연 전용)`)) return
              setTasks([])
              setCarryOverDismissed(true)
              toast.info('빈 보드로 초기화 — 6개 슬롯 모두 비어있습니다. [+ 추가] 버튼을 클릭하여 작성을 시작하세요.', { duration: 5000 })
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-dashed border-amber-400 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
            title="현재 task 모두 지우고 빈 보드 시작 (시연용)"
          >
            새 보드 시작
          </button>
          <button
            onClick={() => toast.info('내일로 임시 저장 (Mock)')}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
          >
            <Save className="w-4 h-4" /> 임시 저장
          </button>
          <button
            onClick={handleSubmit}
            disabled={filledCount === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> 팀장 공유 → 제출
          </button>
        </div>
      </div>

      {/* OKR Limiting Step Banner (Round 14 FR-033) */}
      <OkrLimitingStepBanner />

      {/* Carry-over Banner */}
      {!carryOverDismissed && carryOverCandidates.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                어제 미완료 {carryOverCandidates.length}건 — 오늘로 이월하시겠어요?
              </p>
              <ul className="mt-2 space-y-1">
                {carryOverCandidates.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium flex-1 truncate">{t.title}</span>
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border',
                      C6_STATUS_DEFS.find((s) => s.code === t.status)?.bgColor,
                      C6_STATUS_DEFS.find((s) => s.code === t.status)?.color
                    )}>
                      {C6_STATUS_DEFS.find((s) => s.code === t.status)?.label}
                    </span>
                    {(t.carryCount ?? 0) >= 1 && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400">
                        {(t.carryCount ?? 0) + 1}회 이월
                      </span>
                    )}
                    <button
                      onClick={() => importCarryOver(t)}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600"
                    >
                      이월
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setCarryOverDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="배너 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Task slots — 무제한 (Round 16, 권장 6개) */}
      <div className="space-y-2">
        {/* 작성된 task들 */}
        {[...tasks].sort((a, b) => a.rank - b.rank).map((task) => {
          const isDragOver = dragOverRank === task.rank
          return (
            <TaskRow
              key={task.id}
              task={task}
              isDragging={draggingId === task.id}
              isDragOver={isDragOver}
              collaboratorOpen={collaboratorOpenId === task.id}
              onDragStart={() => handleDragStart(task.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => { e.preventDefault(); setDragOverRank(task.rank) }}
              onDragLeave={() => setDragOverRank((r) => r === task.rank ? null : r)}
              onDrop={() => handleDrop(task.rank)}
              onUpdate={(patch) => updateTask(task.id, patch)}
              onRemove={() => removeTask(task.id)}
              onToggleCollab={() => setCollaboratorOpenId((id) => id === task.id ? null : task.id)}
            />
          )
        })}

        {/* 권장 6개까지 빈 슬롯 노출 (가독성 + 작성 안내) */}
        {filledCount < 6 && Array.from({ length: 6 - filledCount }).map((_, i) => {
          const slotRank = (filledCount + i + 1) as TaskRank
          return (
            <button
              key={`empty-slot-${slotRank}`}
              onClick={() => addTask()}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-border hover:border-pink-400 hover:bg-pink-50/30 dark:hover:bg-pink-950/10 transition-all text-left group"
            >
              <span className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground group-hover:bg-pink-200 dark:group-hover:bg-pink-900 group-hover:text-pink-700 transition-colors">
                {slotRank}
              </span>
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-pink-500" />
              <span className="text-sm text-muted-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400">+ 추가</span>
              {slotRank <= 6 && (
                <span className="ml-auto text-[10px] text-muted-foreground/60">권장</span>
              )}
            </button>
          )
        })}

        {/* 6개 이상 추가 — 항상 보이는 [+ 추가] 버튼 (꾸미기 톤) */}
        {filledCount >= 6 && (
          <button
            onClick={() => addTask()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-pink-300 dark:border-pink-800 bg-gradient-to-r from-pink-50/50 via-violet-50/50 to-sky-50/50 dark:from-pink-950/20 dark:via-violet-950/20 dark:to-sky-950/20 hover:from-pink-100 hover:to-sky-100 dark:hover:from-pink-950/40 dark:hover:to-sky-950/40 transition-all text-pink-600 dark:text-pink-400 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            할 일이 더 있어요? 추가하기 ✨
            <span className="text-[10px] opacity-70">권장은 6개지만 자유롭게</span>
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        ※ Critical 6 PRD v1.4 (Round 16) — <strong className="text-pink-500">권장 6개</strong> (강제 X) · 3분 작성 · 5단계 상태 · 드래그 우선순위 · 색상/이모지/하트 꾸미기 ✨
        <br />
        {filledCount === 0 && '오늘 일을 시작해볼까요? 빈 슬롯 클릭으로 추가 시작'}
        {filledCount > 0 && filledCount < 6 && (
          <>권장까지 <span className="font-semibold text-pink-500">{6 - filledCount}개</span> 남음 · 자유롭게 추가하세요</>
        )}
        {filledCount === 6 && '오늘 핵심 6개 완성! 🎉 추가도 가능해요'}
        {filledCount > 6 && (
          <>오늘 <span className="font-semibold text-violet-500">{filledCount}개</span> 작성 중 · 권장은 6개지만 자유롭게 ✨</>
        )}
      </p>
    </div>
  )
}

// ==== Task Row Component ====
function TaskRow({
  task, isDragging, isDragOver, collaboratorOpen,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onUpdate, onRemove, onToggleCollab,
}: {
  task: Task
  isDragging: boolean
  isDragOver: boolean
  collaboratorOpen: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: () => void
  onUpdate: (patch: Partial<Task>) => void
  onRemove: () => void
  onToggleCollab: () => void
}) {
  const [titleEditing, setTitleEditing] = useState(!task.title)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const statusDef = C6_STATUS_DEFS.find((s) => s.code === task.status)!
  const channel = task.channelId ? mockClients.find((c) => c.id === task.channelId) : null
  const collaborators = (task.collaborators ?? []).map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean)
  const isBlockedReasonRequired = task.status === 'Blocked'
  const carryNote = (task.carryCount ?? 0) >= 3
    ? `⚠ ${task.carryCount}회 반복 이월 — 분할 검토 필요`
    : (task.carryCount ?? 0) >= 1
      ? `${task.carryCount}회 이월`
      : null

  // 꾸미기 — Round 16 Phase A
  const cardColor = (task.cardColor ?? 'default') as TaskCardColor
  const palette = TASK_CARD_COLOR_PALETTE[cardColor]
  const isHeartStyle = task.importanceStyle === 'heart'
  const isDone = task.status === 'Done'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'border-2 rounded-2xl p-3 transition-all relative',
        palette.bg, palette.border,
        isDragging && 'opacity-40 scale-95 rotate-1',
        isDragOver && 'ring-2 ring-primary',
        isDone && 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'
      )}
    >
      {/* Done glow + check sparkle */}
      {isDone && (
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-pulse">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}
      <div className="flex items-start gap-3">
        {/* Drag handle + Rank */}
        <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing pt-1">
          <GripVertical className="w-4 h-4 text-muted-foreground/60" />
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {task.rank}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title row */}
          <div className="flex items-center gap-2">
            {/* 이모지 picker */}
            <div className="relative">
              <button
                onClick={() => { setEmojiPickerOpen((v) => !v); setColorPickerOpen(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-lg"
                title="이모지 변경"
              >
                {task.emoji ?? '😊'}
              </button>
              {emojiPickerOpen && (
                <div className="absolute top-9 left-0 z-20 bg-popover border-2 border-pink-200 dark:border-pink-800 rounded-2xl shadow-lg p-2 w-56">
                  <div className="grid grid-cols-6 gap-1">
                    {TASK_EMOJI_PRESETS.map((e) => (
                      <button
                        key={e}
                        onClick={() => { onUpdate({ emoji: e }); setEmojiPickerOpen(false) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-pink-100 dark:hover:bg-pink-950 text-lg"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { onUpdate({ emoji: undefined }); setEmojiPickerOpen(false) }}
                    className="w-full mt-2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    이모지 제거
                  </button>
                </div>
              )}
            </div>

            {titleEditing ? (
              <input
                autoFocus
                value={task.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                onBlur={() => setTitleEditing(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setTitleEditing(false) }}
                placeholder="업무 제목 입력 (예: Trip.com Q3 단가 협상)"
                className="flex-1 h-8 px-2 rounded-lg border-2 border-pink-300 dark:border-pink-700 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            ) : (
              <button
                onClick={() => setTitleEditing(true)}
                className={cn(
                  'flex-1 text-left text-sm font-medium hover:text-pink-600 dark:hover:text-pink-400 truncate transition-colors',
                  isDone && 'line-through text-muted-foreground'
                )}
              >
                {task.title || '+ 제목 입력'}
              </button>
            )}

            {/* 색상 picker */}
            <div className="relative">
              <button
                onClick={() => { setColorPickerOpen((v) => !v); setEmojiPickerOpen(false) }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-black/20"
                title="카드 색상 변경"
              >
                <Palette className="w-4 h-4 text-muted-foreground" />
              </button>
              {colorPickerOpen && (
                <div className="absolute top-8 right-0 z-20 bg-popover border-2 border-pink-200 dark:border-pink-800 rounded-2xl shadow-lg p-2 w-48">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(TASK_CARD_COLOR_PALETTE) as TaskCardColor[]).map((c) => {
                      const p = TASK_CARD_COLOR_PALETTE[c]
                      return (
                        <button
                          key={c}
                          onClick={() => { onUpdate({ cardColor: c }); setColorPickerOpen(false) }}
                          className={cn(
                            'flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 hover:scale-105 transition-transform',
                            p.bg, p.border,
                            cardColor === c && 'ring-2 ring-pink-400'
                          )}
                        >
                          <span className="text-base">{p.emoji}</span>
                          <span className="text-[10px] text-muted-foreground">{p.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-rose-500 p-1"
              aria-label="삭제"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Meta row: importance / category / due / status / collab */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Importance — ⭐/♥ 토글 (꾸미기) */}
            <button
              onClick={() => {
                const next = ((task.importance ?? 1) % 3 + 1) as TaskImportance
                onUpdate({ importance: next })
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                onUpdate({ importanceStyle: isHeartStyle ? 'star' : 'heart' })
              }}
              className="inline-flex items-center px-2 h-6 rounded-lg text-xs hover:bg-white/60 dark:hover:bg-black/20"
              title="좌클릭: 중요도 / 우클릭: ⭐ ↔ ♥ 스타일"
            >
              {isHeartStyle
                ? Array((task.importance ?? 1)).fill('♥').join('')
                : IMPORTANCE_LABELS[task.importance ?? 1]}
            </button>

            {/* Category */}
            <select
              value={task.category}
              onChange={(e) => onUpdate({ category: e.target.value as TaskCategory })}
              className="h-6 px-2 rounded text-xs border border-input bg-background"
              aria-label="카테고리"
            >
              {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>

            {/* Channel (옵션) */}
            {channel && (
              <span className="inline-flex items-center px-2 h-6 rounded text-xs bg-muted text-muted-foreground">
                {channel.name}
              </span>
            )}

            {/* Due time */}
            <div className="inline-flex items-center gap-1 h-6 px-2 rounded border border-input bg-background text-xs">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <input
                type="time"
                value={task.dueAt ? formatTime(task.dueAt) : ''}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  if (isNaN(h)) { onUpdate({ dueAt: undefined }); return }
                  const d = new Date()
                  d.setHours(h, m || 0, 0, 0)
                  onUpdate({ dueAt: d.toISOString() })
                }}
                className="bg-transparent border-0 outline-0 w-[58px] text-xs"
              />
            </div>

            {/* Status */}
            <div className="relative inline-flex">
              <select
                value={task.status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus
                  if (newStatus === 'Blocked' && !task.blockedReason) {
                    const reason = prompt('Blocked 사유를 입력하세요 (10자 이상, BR-027-2):')
                    if (!reason || reason.length < 10) {
                      toast.error('blockedReason 10자 이상 필수')
                      return
                    }
                    onUpdate({ status: newStatus, blockedReason: reason })
                    return
                  }
                  if (newStatus === 'Done') {
                    onUpdate({ status: newStatus, doneAt: new Date().toISOString() })
                    return
                  }
                  onUpdate({ status: newStatus })
                }}
                className={cn(
                  'h-6 pl-2 pr-7 rounded text-xs font-medium border appearance-none cursor-pointer',
                  statusDef.bgColor, statusDef.color
                )}
                aria-label="상태"
              >
                {C6_STATUS_DEFS.filter((s) => s.code !== 'Skipped').map((s) => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1.5 pointer-events-none opacity-60" />
            </div>

            {/* Collaborators */}
            <button
              onClick={onToggleCollab}
              className="inline-flex items-center gap-1 h-6 px-2 rounded border border-border text-xs hover:bg-accent"
              title="협업자"
            >
              <Users className="w-3 h-3" />
              <span className="tabular-nums">{collaborators.length}</span>
            </button>

            {carryNote && (
              <span className={cn('inline-flex items-center gap-1 px-2 h-6 rounded text-[10px]',
                (task.carryCount ?? 0) >= 3 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
              )}>
                {carryNote}
              </span>
            )}
          </div>

          {/* Blocked reason */}
          {isBlockedReasonRequired && task.blockedReason && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/5 border-l-2 border-red-500/40 pl-2 py-1">
              ⚠ {task.blockedReason}
            </p>
          )}

          {/* Collaborators panel */}
          {collaboratorOpen && (
            <div className="border border-border rounded p-2 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">협업자</p>
              {collaborators.length === 0 ? (
                <p className="text-xs text-muted-foreground">협업자 없음</p>
              ) : (
                collaborators.map((u) => (
                  <div key={u!.id} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                      {u!.name.slice(0, 1)}
                    </span>
                    <span className="flex-1">{u!.name}</span>
                    <button
                      onClick={() => onUpdate({ collaborators: (task.collaborators ?? []).filter((id) => id !== u!.id) })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
              <select
                onChange={(e) => {
                  if (e.target.value && !task.collaborators?.includes(e.target.value)) {
                    onUpdate({ collaborators: [...(task.collaborators ?? []), e.target.value] })
                  }
                  e.target.value = ''
                }}
                className="w-full h-7 mt-1 px-2 text-xs border border-input bg-background rounded"
                aria-label="협업자 추가"
              >
                <option value="">+ 협업자 추가</option>
                {mockUsers
                  .filter((u) => u.id !== task.ownerUserId && !task.collaborators?.includes(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// OKR Limiting Step Banner (Round 14 FR-033 BR-033-5/6)
// ============================================================================
function OkrLimitingStepBanner() {
  const { limitingStep, isHealthy, availableKrs, refreshLimitingStep } = useOkr()
  const { user } = useAuth()

  if (!isHealthy) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
        <strong>OKR 시스템 일시 미연결</strong> — 작성한 내용은 곧 동기화됩니다
      </div>
    )
  }

  if (!limitingStep) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
        <TargetIcon className="w-3.5 h-3.5" />
        OKR 모든 KR이 정상 진척 중입니다 — Limiting Step 추천 없음
        {availableKrs.length > 0 && (
          <span className="ml-auto">
            <Link2 className="w-3 h-3 inline mr-1" />
            본인/팀 활성 KR {availableKrs.length}건
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-violet-50 dark:bg-violet-950 border-2 border-violet-300 dark:border-violet-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <TargetIcon className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            🎯 Limiting Step 추천
            {limitingStep.isFallback && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-200 dark:bg-violet-900 text-violet-800 dark:text-violet-200 font-normal">
                fallback (신규 KR)
              </span>
            )}
          </p>
          <p className="text-base font-bold mt-1">{limitingStep.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            진척률 {(limitingStep.progress * 100).toFixed(0)}% / 기대 {(limitingStep.expectedProgress * 100).toFixed(0)}% — 가장 뒤쳐짐 ({limitingStep.delay} 지연)
          </p>
          {limitingStep.reason && (
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 italic">{limitingStep.reason}</p>
          )}
          <div className="mt-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">추천 task:</p>
            <ul className="space-y-1">
              {limitingStep.recommendedTasks.map((t, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                  <span className="text-violet-500 shrink-0">›</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => toast.success('추천 적용됨 (Mock) — 6개 슬롯에 자동 입력', { description: 'AC-033-5' })}
              className="px-3 py-1.5 text-xs rounded-md bg-violet-600 text-white hover:bg-violet-700 font-medium"
            >
              추천 적용
            </button>
            <button
              onClick={() => {
                if (user) localStorage.setItem(`okr_limiting_suppress_${user.id}`, String(Date.now()))
                refreshLimitingStep()
                toast.info('24시간 동안 추천 무시', { description: 'BR-035-3' })
              }}
              className="px-3 py-1.5 text-xs rounded-md border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900"
            >
              무시 (24h)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
