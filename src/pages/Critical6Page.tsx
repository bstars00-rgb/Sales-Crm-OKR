import { useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
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
import type { Task, TaskStatus, TaskRank, TaskImportance, TaskCategory, TaskCardColor, ChecklistItem, TaskAttachment, RecurringRule, RecurringFrequency } from '@/types'
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
  // 30분 단위로 normalize (가까운 30분 단위로 반올림)
  const m = d.getMinutes()
  const normalized = m < 15 ? 0 : m < 45 ? 30 : 60
  let hour = d.getHours()
  let minute = normalized
  if (normalized === 60) { hour = (hour + 1) % 24; minute = 0 }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// 30분 단위 시간 옵션 (06:00 ~ 23:30, 36개)
function generateHalfHourOptions() {
  const options: ReactElement[] = []
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const value = `${hh}:${mm}`
      options.push(<option key={value} value={value}>{value}</option>)
    }
  }
  return options
}

// Round 16 Phase D — 날짜 helper
function getDateOffset(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr)
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
}

function formatRelativeDay(dateStr: string): string {
  const today = todayKST()
  const tomorrow = getDateOffset(1)
  const dayAfter = getDateOffset(2)
  if (dateStr === today) return '오늘'
  if (dateStr === tomorrow) return '내일'
  if (dateStr === dayAfter) return '모레'
  // 며칠 후
  const diff = Math.round((new Date(dateStr).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
  if (diff > 0 && diff <= 7) return `${diff}일 후`
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)}일 전`
  return dateStr.slice(5) // MM-DD
}

// 날짜 picker chip bar
function DatePickerChips({
  selectedDate, onSelect,
}: { selectedDate: string; onSelect: (d: string) => void }) {
  const today = todayKST()
  const presets = [
    { id: 'today',     label: '오늘',   date: today,             emoji: '🌟' },
    { id: 'tomorrow',  label: '내일',   date: getDateOffset(1),  emoji: '🌅' },
    { id: 'day_after', label: '모레',   date: getDateOffset(2),  emoji: '📅' },
    { id: 'next_week', label: '다음 주', date: getDateOffset(7),  emoji: '🗓️' },
  ]
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.date)}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            selectedDate === p.date
              ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md scale-105'
              : 'bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950'
          )}
        >
          <span>{p.emoji}</span>
          <span>{p.label}</span>
          <span className="text-[10px] opacity-70">{p.date.slice(5)}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowCustom((v) => !v)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-pink-300 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950"
        >
          <CalendarIcon className="w-3 h-3" /> 날짜 선택
        </button>
        {showCustom && (
          <div className="absolute top-9 left-0 z-30 bg-popover border-2 border-pink-200 dark:border-pink-800 rounded-2xl shadow-lg p-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { onSelect(e.target.value); setShowCustom(false) }}
              className="px-2 py-1 rounded-md border border-input bg-background text-sm"
            />
          </div>
        )}
      </div>
      {selectedDate !== today && (
        <span className="text-xs text-violet-500 ml-1">
          ✨ 미래 작성 모드 — {formatRelativeDay(selectedDate)} 할 일 미리 입력 중
        </span>
      )}
    </div>
  )
}

export default function Critical6Page() {
  const { user } = useAuth()
  // 데모 fallback: mock Task가 있는 sales user로 (Sprint 1 demo). 실제 ProD에서는 user.id 그대로.
  const realUserId = user?.id ?? 'u-sales-1'
  const hasTasks = getTodayTasksByUser(realUserId).length > 0
  const userId = hasTasks ? realUserId : 'u-sales-1' // demo: 빈 user는 sales-1 데이터로 진입

  // ==== Phase D — 날짜 picker + 미래 task ====
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKST())

  // Task state — 사용자 + 선택 날짜 기준 (multi-day task는 startDate~dueDate 사이 모든 날짜에 표시)
  const [allTasks, setAllTasks] = useState<Task[]>(() =>
    mockCritical6Tasks.filter((t) => t.ownerUserId === userId)
  )
  const tasks = useMemo(() => {
    return allTasks.filter((t) => {
      // multi-day task: startDate ~ dueDate 사이라면 표시
      if (t.multiDay && t.startDate && t.dueDate) {
        return selectedDate >= t.startDate && selectedDate <= t.dueDate
      }
      // 단일 일자: t.date 또는 startDate 매칭
      return t.date === selectedDate || t.startDate === selectedDate
    })
  }, [allTasks, selectedDate])

  // ==== View mode (Phase G + H + J) ====
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'schedule' | 'all' | 'charts'>('list')

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverRank, setDragOverRank] = useState<TaskRank | null>(null)
  const [carryOverDismissed, setCarryOverDismissed] = useState(false)
  const [collaboratorOpenId, setCollaboratorOpenId] = useState<string | null>(null)

  // 사용자 변경 시 Task 다시 로드
  useEffect(() => {
    setAllTasks(mockCritical6Tasks.filter((t) => t.ownerUserId === userId))
  }, [userId])

  // ==== Phase B 꾸미기: streak + 배경 테마 + 배지 (localStorage) ====
  const [streak] = useState(() => {
    // 시연용 — 사용자별 무작위 1~12일 (실제는 localStorage에서 last write date 기반 계산)
    const stored = localStorage.getItem(`c6_streak_${userId}`)
    if (stored) return parseInt(stored)
    const random = Math.floor(Math.random() * 12) + 1
    localStorage.setItem(`c6_streak_${userId}`, String(random))
    return random
  })
  const [boardTheme, setBoardTheme] = useState<string>(() => {
    return localStorage.getItem(`c6_theme_${userId}`) ?? 'default'
  })
  const setTheme = (t: string) => {
    setBoardTheme(t)
    localStorage.setItem(`c6_theme_${userId}`, t)
  }
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  // 누적 Done — 시연용 무작위
  const [totalDone] = useState(() => {
    const stored = localStorage.getItem(`c6_total_done_${userId}`)
    if (stored) return parseInt(stored)
    const random = Math.floor(Math.random() * 80) + 5
    localStorage.setItem(`c6_total_done_${userId}`, String(random))
    return random
  })
  const earnedBadges = useMemo(() => {
    const badges: string[] = []
    if (streak >= 3) badges.push('🔥 3일 연속')
    if (streak >= 7) badges.push('🏅 일주일')
    if (streak >= 30) badges.push('💎 한 달')
    if (totalDone >= 7) badges.push('🌱 새싹')
    if (totalDone >= 30) badges.push('🌳 성장')
    if (totalDone >= 90) badges.push('🏆 마에스트로')
    return badges
  }, [streak, totalDone])

  const carryOverCandidates = useMemo(
    () => getCarryOverCandidates(userId).filter((t) => !tasks.some((x) => x.carriedOverFrom === t.id)),
    [userId, tasks]
  )

  const filledCount = tasks.length
  const emptySlots = 6 - filledCount

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'Done').length
    const inProgress = tasks.filter((t) => t.status === 'InProgress').length
    const waiting = tasks.filter((t) => t.status === 'Waiting').length
    return { done, inProgress, waiting, completionRate: tasks.length > 0 ? done / tasks.length : 0 }
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
    setAllTasks((prev) => {
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

  // ==== Phase L — 반복 task 다음 인스턴스 자동 생성 helper ====
  const computeNextRecurringDate = (current: string, rule: RecurringRule): string => {
    const d = new Date(current)
    const interval = rule.interval ?? 1
    if (rule.frequency === 'daily') d.setDate(d.getDate() + interval)
    else if (rule.frequency === 'weekly') d.setDate(d.getDate() + 7 * interval)
    else if (rule.frequency === 'monthly') d.setMonth(d.getMonth() + interval)
    return d.toISOString().split('T')[0]
  }

  // ==== Mutations ====
  const updateTask = (id: string, patch: Partial<Task>) => {
    // 날짜 변경 (startDate/dueDate/date) 감지 — Undo + auto-navigate
    const isDateChange = patch.startDate || patch.dueDate || patch.date
    let snapshot: Task | undefined
    if (isDateChange) {
      snapshot = allTasks.find((t) => t.id === id)
    }
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
    )
    // 날짜 변경 시 — 변경된 날짜가 selectedDate 범위에서 벗어나면 자동 navigate + Undo
    if (isDateChange && snapshot) {
      const newStart = patch.startDate ?? snapshot.startDate ?? snapshot.date
      const newDue = patch.dueDate ?? snapshot.dueDate ?? snapshot.startDate ?? snapshot.date
      const willBeVisible = (selectedDate >= newStart && selectedDate <= newDue) || newStart === selectedDate
      if (!willBeVisible && newStart !== selectedDate) {
        // task가 현재 보드에서 사라지므로 자동 navigate + Undo
        const prevSelectedDate = selectedDate
        setSelectedDate(newStart)
        toast.success(
          `📆 ${formatRelativeDay(newStart)} (${newStart})로 이동 — "${snapshot.title || '(제목 없음)'}"`,
          {
            duration: 8000,
            action: {
              label: '↩ 되돌리기',
              onClick: () => {
                // 원래 task 복원 + 원래 날짜로 navigate
                setAllTasks((prev) =>
                  prev.map((t) => (t.id === id ? snapshot! : t))
                )
                setSelectedDate(prevSelectedDate)
                toast.info('변경 취소됨')
              },
            },
          }
        )
      }
    }
    // Phase L — 반복 task: status → Done 시 다음 인스턴스 자동 생성
    if (patch.status === 'Done') {
      const target = allTasks.find((t) => t.id === id)
      if (target?.recurring && target.recurring.frequency !== 'none') {
        const currentDate = target.startDate ?? target.date
        const nextDate = computeNextRecurringDate(currentDate, target.recurring)
        // 종료일 체크
        if (target.recurring.endDate && nextDate > target.recurring.endDate) {
          toast.info(`🔁 반복 종료 (${target.recurring.endDate} 도달)`)
        } else {
          const now = new Date().toISOString()
          const newTask: Task = {
            ...target,
            id: `task-recur-${Date.now()}`,
            date: nextDate,
            startDate: nextDate,
            dueDate: nextDate,
            status: 'Planned',
            doneAt: undefined,
            createdAt: now,
            updatedAt: now,
          }
          setAllTasks((prev) => [...prev, newTask])
          toast.success(`🔁 다음 반복 자동 생성 — ${formatRelativeDay(nextDate)}`)
        }
      }
    }
  }

  const removeTask = (id: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id).map((t, i) => ({ ...t, rank: (i + 1) as TaskRank })))
    toast.info('업무 삭제')
  }

  const addTask = (preset?: Partial<Task>) => {
    // Round 16: 6개 제한 해제 — 권장 6개이지만 무제한 추가 가능
    const nextRank = (filledCount + 1) as TaskRank
    const now = new Date().toISOString()
    const newTask: Task = {
      id: `task-new-${Date.now()}`,
      ownerUserId: userId,
      date: selectedDate,                          // 선택된 날짜 기준으로 생성 (미래 task 작성 가능)
      startDate: selectedDate,
      dueDate: selectedDate,
      rank: nextRank,
      category: 'NewDeal',
      title: preset?.title ?? '',
      status: 'Planned',
      importance: 2,
      urgency: 'normal',
      collaborators: [],
      carryCount: 0,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      ...preset,
    }
    setAllTasks((prev) => [...prev, newTask])
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

  // 배경 테마 클래스
  const themeBgClass: Record<string, string> = {
    default:    '',
    cherry:     'bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-orange-950/20',
    sky:        'bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-sky-950/20 dark:via-blue-950/20 dark:to-cyan-950/20',
    starry:     'bg-gradient-to-br from-violet-100 via-indigo-50 to-blue-50 dark:from-violet-950/30 dark:via-indigo-950/30 dark:to-blue-950/30',
    cloud:      'bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/30',
    forest:     'bg-gradient-to-br from-emerald-50 via-lime-50 to-yellow-50 dark:from-emerald-950/20 dark:via-lime-950/20 dark:to-yellow-950/20',
    sunset:     'bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-purple-950/30',
    dot:        'bg-[radial-gradient(circle,_rgba(244,114,182,0.15)_1px,_transparent_1px)] [background-size:16px_16px]',
  }
  const THEME_OPTIONS = [
    { id: 'default', label: '기본',     emoji: '⚪' },
    { id: 'cherry',  label: '벚꽃',     emoji: '🌸' },
    { id: 'sky',     label: '하늘',     emoji: '🌤️' },
    { id: 'starry',  label: '별밤',     emoji: '✨' },
    { id: 'cloud',   label: '구름',     emoji: '☁️' },
    { id: 'forest',  label: '숲',       emoji: '🌳' },
    { id: 'sunset',  label: '노을',     emoji: '🌇' },
    { id: 'dot',     label: '도트',     emoji: '⚫' },
  ]

  return (
    <div className={cn('w-full space-y-5 -mx-2 px-2 -my-2 py-4 rounded-3xl transition-colors', themeBgClass[boardTheme])}>
      {/* Streak + Badges Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white text-xs font-bold shadow-sm">
            🔥 {streak}일 연속
          </span>
          {earnedBadges.map((b, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-800 text-xs"
            >
              {b}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            누적 완료 {totalDone}건
          </span>
        </div>
        {/* 배경 테마 선택 */}
        <div className="relative">
          <button
            onClick={() => setThemePickerOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-pink-200 dark:border-pink-800 bg-white dark:bg-slate-800 text-xs hover:bg-pink-50 dark:hover:bg-pink-950"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{THEME_OPTIONS.find((t) => t.id === boardTheme)?.emoji} {THEME_OPTIONS.find((t) => t.id === boardTheme)?.label}</span>
          </button>
          {themePickerOpen && (
            <div className="absolute top-9 right-0 z-30 bg-popover border-2 border-pink-200 dark:border-pink-800 rounded-2xl shadow-lg p-2 w-44">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-1">배경 테마</p>
              <div className="grid grid-cols-2 gap-1">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setThemePickerOpen(false) }}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs hover:bg-pink-50 dark:hover:bg-pink-950',
                      boardTheme === t.id && 'bg-pink-100 dark:bg-pink-900 ring-1 ring-pink-400'
                    )}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 날짜 picker 칩 (Phase D) */}
      <DatePickerChips selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" />
            Critical 6 — {selectedDate === todayKST() ? '오늘' : formatRelativeDay(selectedDate)}의 핵심 ✨
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
              v1.5
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedDate} ({getDayName(selectedDate)}) ·{' '}
            <span className="font-semibold">
              {filledCount}개 작성
              {filledCount > 0 && filledCount <= 6 && <span className="text-pink-500"> · 권장 6개</span>}
              {filledCount > 6 && <span className="text-violet-500"> · 권장 +{filledCount - 6}개 ✨</span>}
            </span> ·{' '}
            완료 {stats.done} · 진행 {stats.inProgress} · 대기 {stats.waiting}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle (Phase G + H) */}
          <div className="inline-flex rounded-md border border-border h-9 overflow-hidden">
            {[
              { id: 'list' as const,     icon: '📋', label: '목록' },
              { id: 'board' as const,    icon: '📊', label: '보드' },
              { id: 'schedule' as const, icon: '🗓️', label: '캘린더' },
              { id: 'all' as const,      icon: '🔎', label: '전체' },
              { id: 'charts' as const,   icon: '📈', label: '분석' },
            ].map((m, i) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={cn(
                  'px-2.5 text-xs flex items-center gap-1',
                  i > 0 && 'border-l border-border',
                  viewMode === m.id ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300' : 'hover:bg-accent'
                )}
                title={m.label}
              >
                <span>{m.icon}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (tasks.length > 0 && !confirm(`현재 ${tasks.length}개 업무를 모두 지우고 빈 보드로 시작합니다.\n계속하시겠습니까? (시연 전용)`)) return
              setAllTasks([])
              setCarryOverDismissed(true)
              toast.info('빈 보드로 초기화 — [+ 추가] 버튼을 클릭하여 작성을 시작하세요.', { duration: 5000 })
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

      {/* List view (default) */}
      {viewMode === 'list' && (
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
                selectedDate={selectedDate}
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

          {/* 6개 이상 추가 */}
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
      )}

      {/* Board view (Phase G — Kanban 4 컬럼) */}
      {viewMode === 'board' && (
        <BoardView
          tasks={tasks}
          onUpdate={updateTask}
          onRemove={removeTask}
          onAdd={(status) => addTask({ status })}
        />
      )}

      {/* Schedule view (Phase H — 월간 캘린더, 모든 task 한 화면) */}
      {viewMode === 'schedule' && (
        <ScheduleView
          allTasks={allTasks}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onUpdateTask={updateTask}
        />
      )}

      {/* All Tasks view (Phase H — 날짜 무관 검색/필터) */}
      {viewMode === 'all' && (
        <AllTasksView
          allTasks={allTasks}
          onUpdateTask={updateTask}
          onRemoveTask={removeTask}
          onSelectDate={(d) => { setSelectedDate(d); setViewMode('list') }}
        />
      )}

      {/* Charts view (Phase J — 분석) */}
      {viewMode === 'charts' && (
        <ChartsView allTasks={allTasks} />
      )}

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
  task, isDragging, isDragOver, collaboratorOpen, selectedDate,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onUpdate, onRemove, onToggleCollab,
}: {
  task: Task
  isDragging: boolean
  isDragOver: boolean
  collaboratorOpen: boolean
  selectedDate: string
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
  const isBlockedReasonRequired = false // Round 16: Blocked 단계 제거
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

  // Phase F — OKR 연계
  const { availableKrs, reportContribution } = useOkr()
  const linkedKr = task.linkedKrId ? availableKrs.find((k) => k.id === task.linkedKrId) : null
  const [krPickerOpen, setKrPickerOpen] = useState(false)

  // Phase D — 마감일 표시
  const dueDate = task.dueDate ?? task.startDate ?? task.date
  const isMultiDay = !!task.multiDay && task.startDate && task.dueDate && task.startDate !== task.dueDate
  const daysToDue = dueDate
    ? Math.round((new Date(dueDate).getTime() - new Date(selectedDate).getTime()) / (1000 * 60 * 60 * 24))
    : null
  // 오늘 마감은 표시 안 함 (selectedDate가 오늘이면 redundant)
  const dueLabel = daysToDue === null || daysToDue === 0
    ? null
    : daysToDue > 0
      ? `${daysToDue}일 남음`
      : `${Math.abs(daysToDue)}일 지남`

  // Phase F — status 변경 시 자동 reportContribution
  const updateStatus = (newStatus: TaskStatus) => {
    const completionRatio = newStatus === 'Done' ? 1.0 : newStatus === 'InProgress' ? 0.5 : 0
    onUpdate({ status: newStatus })
    // KR 매핑된 task만 OKR Platform에 보고
    if (task.linkedKrId && task.id) {
      reportContribution({
        krId: task.linkedKrId,
        contributionType: 'critical6_task',
        externalId: task.id,
        completionRatio,
        contributionWeight: (task.importance ?? 1) / 6, // 중요도 기반 weight
      }).catch(() => {/* graceful degrade */})
      if (newStatus === 'Done' && linkedKr) {
        toast.success(`✨ ${linkedKr.title} +${Math.round((task.importance ?? 1) / 6 * 100)}% 기여`)
      }
    }
  }

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

          {/* Meta row: importance / KR / channel / category / due / status / collab */}
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

            {/* Phase F — KR 매핑 picker */}
            <div className="relative">
              <button
                onClick={() => setKrPickerOpen((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 h-6 rounded-lg text-xs hover:bg-white/60 dark:hover:bg-black/20',
                  linkedKr ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300' : 'text-muted-foreground'
                )}
                title={linkedKr ? `${linkedKr.title} 기여` : 'OKR 연결 안 됨'}
              >
                <TargetIcon className="w-3 h-3" />
                <span className="truncate max-w-[120px]">
                  {linkedKr ? linkedKr.title.slice(0, 18) : 'OKR 연결'}
                </span>
              </button>
              {krPickerOpen && (
                <div className="absolute top-7 left-0 z-30 bg-popover border-2 border-violet-200 dark:border-violet-800 rounded-2xl shadow-lg p-2 w-72 max-h-72 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-1">이 task가 기여하는 KR</p>
                  <button
                    onClick={() => { onUpdate({ linkedKrId: undefined }); setKrPickerOpen(false) }}
                    className={cn(
                      'w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-violet-50 dark:hover:bg-violet-950 mb-1',
                      !task.linkedKrId && 'bg-violet-50 dark:bg-violet-950'
                    )}
                  >
                    연결 안 함
                  </button>
                  {availableKrs.map((kr) => (
                    <button
                      key={kr.id}
                      onClick={() => {
                        onUpdate({ linkedKrId: kr.id })
                        setKrPickerOpen(false)
                        toast.success(`${kr.title}에 연결됨 — 완료 시 진척률 자동 반영`)
                      }}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-violet-50 dark:hover:bg-violet-950',
                        task.linkedKrId === kr.id && 'bg-violet-100 dark:bg-violet-900'
                      )}
                    >
                      <div className="font-medium truncate">{kr.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        진척 {Math.round((kr.progress ?? 0) * 100)}% · {kr.quarter}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

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

            {/* Channel picker — CRM 연동 (Round 16) */}
            <ChannelPicker
              channelId={task.channelId}
              onSelect={(id) => onUpdate({ channelId: id })}
            />

            {/* Date picker — 시작일/마감일 변경 (Round 16) */}
            <DatePickerInline
              startDate={task.startDate ?? task.date}
              dueDate={task.dueDate ?? task.startDate ?? task.date}
              multiDay={!!task.multiDay}
              currentSelectedDate={selectedDate}
              taskTitle={task.title || '(제목 없음)'}
              onChange={(patch) => onUpdate(patch)}
            />

            {/* Due time — 30분 단위 select (Round 16 Phase D) */}
            <div className="inline-flex items-center gap-1 h-6 px-2 rounded border border-input bg-background text-xs">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <select
                value={task.dueAt ? formatTime(task.dueAt) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) { onUpdate({ dueAt: undefined }); return }
                  const [h, m] = v.split(':').map(Number)
                  // dueDate 기준 시간 설정 (없으면 오늘)
                  const baseDate = task.dueDate ?? task.startDate ?? task.date
                  const d = new Date(`${baseDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
                  onUpdate({ dueAt: d.toISOString() })
                }}
                className="bg-transparent border-0 outline-0 text-xs cursor-pointer"
                aria-label="마감 시각 (30분 단위)"
              >
                <option value="">시간 미설정</option>
                {generateHalfHourOptions()}
              </select>
            </div>

            {/* Status */}
            <div className="relative inline-flex">
              <select
                value={task.status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus
                  if (newStatus === 'Done') {
                    onUpdate({ doneAt: new Date().toISOString() })
                  }
                  // Phase F — auto reportContribution
                  updateStatus(newStatus)
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

            {/* Phase D — multi-day 배지 + 마감 표시 */}
            {isMultiDay && (
              <span className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px]" title={`${task.startDate} ~ ${task.dueDate}`}>
                📆 {task.startDate?.slice(5)}~{task.dueDate?.slice(5)}
              </span>
            )}
            {dueLabel && !isDone && (
              <span className={cn(
                'inline-flex items-center px-2 h-6 rounded-md text-[10px]',
                daysToDue !== null && daysToDue < 0 ? 'bg-rose-100 text-rose-700' :
                'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              )}>
                ⏰ {dueLabel}
              </span>
            )}
          </div>

          {/* Blocked reason */}
          {isBlockedReasonRequired && task.blockedReason && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/5 border-l-2 border-red-500/40 pl-2 py-1">
              ⚠ {task.blockedReason}
            </p>
          )}

          {/* Phase I — Checklist (sub-task) */}
          <ChecklistEditor
            items={task.checklist ?? []}
            onChange={(items) => onUpdate({ checklist: items })}
          />

          {/* Phase K — Attachments (파일/링크) */}
          <AttachmentEditor
            attachments={task.attachments ?? []}
            ownerId={task.ownerUserId}
            onChange={(items) => onUpdate({ attachments: items })}
          />

          {/* Phase L — Recurring (반복 task) */}
          <RecurringEditor
            recurring={task.recurring}
            onChange={(rule) => onUpdate({ recurring: rule })}
          />

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
// Channel Picker (Round 16 — CRM 연동, task 카드에서 업체 선택)
// ============================================================================
function ChannelPicker({ channelId, onSelect }: { channelId?: string; onSelect: (id: string | undefined) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const channel = channelId ? mockClients.find((c) => c.id === channelId) : null

  const filtered = useMemo(() => {
    if (!query.trim()) return mockClients.slice(0, 30)
    const q = query.toLowerCase()
    return mockClients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 30)
  }, [query])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 px-2 h-6 rounded-md text-xs border',
          channel
            ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            : 'border-dashed border-border text-muted-foreground hover:border-blue-400'
        )}
        title="업체 선택 (CRM 연동)"
      >
        🏢 {channel ? channel.name : '+ 업체 선택'}
      </button>
      {open && (
        <div className="absolute top-7 left-0 z-30 bg-popover border-2 border-blue-200 dark:border-blue-800 rounded-2xl shadow-lg p-2 w-72 max-h-80 overflow-y-auto">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="업체명 검색..."
            className="w-full mb-1.5 px-2 py-1 rounded-md border border-input bg-background text-xs"
          />
          {channelId && (
            <button
              onClick={() => { onSelect(undefined); setOpen(false) }}
              className="w-full text-left px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-accent mb-1"
            >
              연결 해제
            </button>
          )}
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-2">검색 결과 없음</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { onSelect(c.id); setOpen(false); setQuery('') }}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded-md text-xs hover:bg-blue-50 dark:hover:bg-blue-950',
                      channelId === c.id && 'bg-blue-100 dark:bg-blue-900'
                    )}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.country && <span className="ml-1 text-[10px] text-muted-foreground">{c.country}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-muted-foreground mt-2 px-1 border-t border-border pt-1">
            🔗 CRM 연동 — 선택된 업체의 Activity Timeline에 자동 연결됩니다.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Date Picker Inline (Round 16 — 기존 task의 시작일/마감일 변경)
// ============================================================================
function DatePickerInline({
  startDate, dueDate, multiDay, onChange,
}: {
  startDate: string
  dueDate: string
  multiDay: boolean
  currentSelectedDate?: string
  taskTitle?: string
  onChange: (patch: { startDate?: string; dueDate?: string; multiDay?: boolean; date?: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const isMultiDay = startDate !== dueDate

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-xs border border-input bg-background hover:bg-accent"
        title="날짜 변경"
      >
        <CalendarIcon className="w-3 h-3" />
        {isMultiDay
          ? <span>📆 {startDate.slice(5)} ~ {dueDate.slice(5)}</span>
          : <span>{startDate.slice(5)}</span>}
      </button>
      {open && (
        <div className="absolute top-7 left-0 z-30 bg-popover border-2 border-pink-200 dark:border-pink-800 rounded-2xl shadow-lg p-3 w-72">
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted-foreground">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value
                  // dueDate가 startDate보다 이전이면 dueDate도 같이 이동
                  const newDue = dueDate < newStart ? newStart : dueDate
                  onChange({
                    startDate: newStart,
                    dueDate: newDue,
                    date: newStart,
                    multiDay: newStart !== newDue,
                  })
                }}
                className="w-full mt-0.5 px-2 py-1 rounded-md border border-input bg-background text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">마감일</label>
              <input
                type="date"
                value={dueDate}
                min={startDate}
                onChange={(e) => {
                  const newDue = e.target.value
                  onChange({
                    dueDate: newDue,
                    multiDay: startDate !== newDue,
                  })
                }}
                className="w-full mt-0.5 px-2 py-1 rounded-md border border-input bg-background text-xs"
              />
            </div>
            {isMultiDay && (
              <p className="text-[10px] text-violet-500">
                📆 {Math.round((new Date(dueDate).getTime() - new Date(startDate).getTime()) / (86400000)) + 1}일 작업
              </p>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs px-2 py-1 rounded-md bg-pink-500 text-white hover:bg-pink-600 mt-2"
            >
              완료
            </button>
          </div>
        </div>
      )}
      {void multiDay /* suppress unused */}
    </div>
  )
}

// ============================================================================
// Charts View (Phase J — 분석: 완료율 / Status / KR / 카테고리)
// ============================================================================
function ChartsView({ allTasks }: { allTasks: Task[] }) {
  // 1. 일별 완료율 (지난 30일)
  const dailyCompletion = useMemo(() => {
    const days: { date: string; total: number; done: number; rate: number }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dayTasks = allTasks.filter((t) => (t.startDate ?? t.date) === ds)
      const done = dayTasks.filter((t) => t.status === 'Done').length
      days.push({
        date: ds.slice(5),
        total: dayTasks.length,
        done,
        rate: dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0,
      })
    }
    return days
  }, [allTasks])

  // 2. Status 분포 (전체)
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {}
    allTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [allTasks])

  // 3. KR 분포 (linkedKrId 기준)
  const krDist = useMemo(() => {
    const counts: Record<string, number> = {}
    allTasks.forEach((t) => {
      const key = t.linkedKrId ?? '(미연결)'
      counts[key] = (counts[key] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '..' : name, value }))
  }, [allTasks])

  // 4. 카테고리 분포
  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {}
    allTasks.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [allTasks])

  // Stats summary
  const totalTasks = allTasks.length
  const totalDone = allTasks.filter((t) => t.status === 'Done').length
  const totalLinked = allTasks.filter((t) => t.linkedKrId).length
  const overallRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  const STATUS_COLORS: Record<string, string> = {
    Planned: '#94a3b8',
    InProgress: '#3b82f6',
    Waiting: '#f59e0b',
    Done: '#10b981',
    Blocked: '#ef4444',
    Skipped: '#64748b',
  }
  const STAR_COLORS = ['#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="전체 task" value={String(totalTasks)} />
        <StatCard label="완료" value={`${totalDone} / ${totalTasks}`} accent="emerald" />
        <StatCard label="완료율" value={`${overallRate}%`} accent="pink" />
        <StatCard label="OKR 매핑률" value={`${totalTasks > 0 ? Math.round((totalLinked / totalTasks) * 100) : 0}%`} accent="violet" />
      </div>

      {/* Daily completion (지난 30일) */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">📈 일별 완료율 (지난 30일)</h3>
        <div className="h-48">
          <RechartsLineChart data={dailyCompletion} />
        </div>
      </div>

      {/* Status / KR distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">📊 Status 분포</h3>
          <div className="h-56">
            <RechartsPieChart data={statusDist} colors={statusDist.map((s) => STATUS_COLORS[s.name] ?? '#888')} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">🎯 KR 매핑 분포</h3>
          <div className="h-56">
            <RechartsBarChart data={krDist} color="#a855f7" />
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">📋 카테고리 분포</h3>
        <div className="h-48">
          <RechartsBarChart data={categoryDist} color="#ec4899" />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        ※ 분석 뷰 — 모든 task 기준 (날짜 필터 무관). Sprint 4 Reports 정식 구현 시 더 많은 차트 + 기간 필터 추가 예정.
      </p>
      {void STAR_COLORS}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: 'emerald' | 'pink' | 'violet' }) {
  const accentClass: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    pink: 'text-pink-600 dark:text-pink-400',
    violet: 'text-violet-600 dark:text-violet-400',
  }
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums mt-1', accent && accentClass[accent])}>{value}</p>
    </div>
  )
}

// Recharts wrappers
function RechartsLineChart({ data }: { data: { date: string; rate: number; total: number; done: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="완료율 (%)" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function RechartsPieChart({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e: { name: string; value: number }) => `${e.name} ${e.value}`}>
          {data.map((_, i) => <Cell key={i} fill={colors[i] ?? '#888'} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

function RechartsBarChart({ data, color }: { data: { name: string; value: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================================================
// Checklist Editor (Phase I — sub-task in card)
// ============================================================================
function ChecklistEditor({
  items, onChange,
}: {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}) {
  const [expanded, setExpanded] = useState(items.length > 0)
  const [newText, setNewText] = useState('')

  const doneCount = items.filter((i) => i.done).length
  const totalCount = items.length
  const progress = totalCount > 0 ? doneCount / totalCount : 0

  const addItem = () => {
    if (!newText.trim()) return
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newText.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    }
    onChange([...items, newItem])
    setNewText('')
  }

  const toggleItem = (id: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  const updateItemText = (id: string, text: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)))
  }

  if (totalCount === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-[10px] text-muted-foreground hover:text-pink-500 inline-flex items-center gap-1"
      >
        + 체크리스트 추가
      </button>
    )
  }

  return (
    <div className="space-y-1.5 border-t border-border/40 pt-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn('w-3 h-3 transition-transform', !expanded && '-rotate-90')} />
          체크리스트 {totalCount > 0 && <span className="tabular-nums">({doneCount}/{totalCount})</span>}
        </button>
        {totalCount > 0 && (
          <div className="flex-1 mx-2 h-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>

      {expanded && (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.id)}
                className="w-3.5 h-3.5 rounded border-pink-300 text-pink-500 focus:ring-pink-400"
              />
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                className={cn(
                  'flex-1 px-1.5 py-0.5 rounded bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-pink-400 text-xs',
                  item.done && 'line-through text-muted-foreground'
                )}
              />
              <button
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-rose-500 opacity-0 hover:opacity-100 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs pl-5">
            <Plus className="w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
              placeholder="체크리스트 항목 추가 (Enter)"
              className="flex-1 px-1.5 py-0.5 bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-pink-400 rounded text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Recurring Editor (Phase L — 반복 task)
// ============================================================================
function RecurringEditor({
  recurring, onChange,
}: {
  recurring?: RecurringRule
  onChange: (rule: RecurringRule | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const isActive = recurring && recurring.frequency !== 'none'

  if (!isActive && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-muted-foreground hover:text-pink-500 inline-flex items-center gap-1"
      >
        🔁 반복 설정
      </button>
    )
  }

  const labelMap: Record<RecurringFrequency, string> = {
    none: '반복 없음',
    daily: '매일',
    weekly: '매주',
    monthly: '매월',
  }

  return (
    <div className="border-t border-border/40 pt-2">
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-[10px] font-semibold text-muted-foreground inline-flex items-center gap-1">
          🔁 반복:
        </span>
        <select
          value={recurring?.frequency ?? 'none'}
          onChange={(e) => {
            const freq = e.target.value as RecurringFrequency
            if (freq === 'none') {
              onChange(undefined)
              setOpen(false)
              return
            }
            onChange({ frequency: freq, interval: recurring?.interval ?? 1 })
          }}
          className="px-1.5 py-0.5 rounded text-xs border border-input bg-background"
        >
          {(['none', 'daily', 'weekly', 'monthly'] as RecurringFrequency[]).map((f) => (
            <option key={f} value={f}>{labelMap[f]}</option>
          ))}
        </select>
        {isActive && (
          <>
            <span className="text-[10px] text-muted-foreground">매</span>
            <input
              type="number"
              min={1}
              max={30}
              value={recurring?.interval ?? 1}
              onChange={(e) => onChange({
                ...recurring!,
                interval: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)),
              })}
              className="w-12 px-1.5 py-0.5 rounded text-xs border border-input bg-background"
            />
            <span className="text-[10px] text-muted-foreground">
              {recurring?.frequency === 'daily' && '일'}
              {recurring?.frequency === 'weekly' && '주'}
              {recurring?.frequency === 'monthly' && '개월'}
              마다
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">~</span>
            <input
              type="date"
              value={recurring?.endDate ?? ''}
              onChange={(e) => onChange({
                ...recurring!,
                endDate: e.target.value || undefined,
              })}
              className="px-1.5 py-0.5 rounded text-xs border border-input bg-background"
              placeholder="종료일 (옵션)"
            />
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
              ✨ 반복 활성
            </span>
          </>
        )}
      </div>
      {isActive && (
        <p className="text-[10px] text-muted-foreground mt-1 pl-4">
          ※ 완료 시 다음 {labelMap[recurring!.frequency].replace('매', '')} 자동 생성 (Mock — Phase 2 cron 구현 예정)
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Attachment Editor (Phase K — 파일/링크)
// ============================================================================
function AttachmentEditor({
  attachments, ownerId, onChange,
}: {
  attachments: TaskAttachment[]
  ownerId: string
  onChange: (items: TaskAttachment[]) => void
}) {
  const [expanded, setExpanded] = useState(attachments.length > 0)
  const [linkInput, setLinkInput] = useState('')
  const [linkNameInput, setLinkNameInput] = useState('')

  const addLink = () => {
    if (!linkInput.trim()) return
    const newAttach: TaskAttachment = {
      id: `att-${Date.now()}`,
      type: 'link',
      url: linkInput.trim(),
      name: linkNameInput.trim() || linkInput.trim().replace(/^https?:\/\//, '').slice(0, 30),
      uploadedBy: ownerId,
      uploadedAt: new Date().toISOString(),
    }
    onChange([...attachments, newAttach])
    setLinkInput('')
    setLinkNameInput('')
    toast.success('링크 추가됨')
  }

  const addFile = (file: File) => {
    // Mock: file을 실제 업로드하지 않고 metadata만 저장
    const newAttach: TaskAttachment = {
      id: `att-${Date.now()}`,
      type: 'file',
      url: `mock://files/${file.name}`,
      name: file.name,
      size: file.size,
      uploadedBy: ownerId,
      uploadedAt: new Date().toISOString(),
    }
    onChange([...attachments, newAttach])
    toast.success(`📎 ${file.name} 업로드 (Mock)`)
  }

  const removeAttach = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id))
  }

  if (attachments.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-[10px] text-muted-foreground hover:text-pink-500 inline-flex items-center gap-1"
      >
        + 첨부 / 링크 추가
      </button>
    )
  }

  return (
    <div className="space-y-1.5 border-t border-border/40 pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn('w-3 h-3 transition-transform', !expanded && '-rotate-90')} />
        첨부 / 링크 {attachments.length > 0 && <span className="tabular-nums">({attachments.length})</span>}
      </button>

      {expanded && (
        <div className="space-y-1">
          {/* 기존 첨부 목록 */}
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-1.5 text-xs">
              <span className="text-base">{a.type === 'file' ? '📎' : '🔗'}</span>
              {a.type === 'link' ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {a.name}
                </a>
              ) : (
                <span className="flex-1 truncate" title={a.url}>
                  {a.name}
                  {a.size && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({formatFileSize(a.size)})
                    </span>
                  )}
                </span>
              )}
              <button
                onClick={() => removeAttach(a.id)}
                className="text-muted-foreground hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* 링크 추가 input */}
          <div className="flex items-center gap-1.5 text-xs pl-5">
            <span>🔗</span>
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
              placeholder="https://..."
              className="flex-1 px-1.5 py-0.5 bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-pink-400 rounded text-xs"
            />
            <input
              type="text"
              value={linkNameInput}
              onChange={(e) => setLinkNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
              placeholder="이름 (옵션)"
              className="w-20 px-1.5 py-0.5 bg-transparent border-0 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-pink-400 rounded text-xs"
            />
          </div>

          {/* 파일 업로드 (Mock) */}
          <div className="flex items-center gap-1.5 text-xs pl-5">
            <span>📎</span>
            <label className="flex-1 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-950 text-muted-foreground hover:text-pink-600">
              파일 첨부 (Mock — metadata만 저장)
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) addFile(file)
                  e.target.value = '' // reset
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ============================================================================
// Schedule View (Phase H — Monthly calendar, multi-day bar)
// 모든 task를 캘린더에 펼쳐서 보기 — 날짜 변경 후 lost 방지
// ============================================================================
function ScheduleView({
  allTasks, selectedDate, onSelectDate, onUpdateTask,
}: {
  allTasks: Task[]
  selectedDate: string
  onSelectDate: (d: string) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
}) {
  const [monthOffset, setMonthOffset] = useState(0)

  // 캘린더 월 (오늘 + offset)
  const baseDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay() // 0 = Sun
  const daysInMonth = lastDay.getDate()

  // 6주 (42칸) 캘린더 grid 생성
  const cells: { date: string; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = []
  const today = todayKST()
  for (let i = 0; i < 42; i++) {
    const dayOffset = i - startWeekday
    const d = new Date(year, month, 1 + dayOffset)
    const dateStr = d.toISOString().split('T')[0]
    cells.push({
      date: dateStr,
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
    })
  }

  // 각 날짜에 해당하는 task 매핑 (multi-day는 모든 날짜에 표시)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const t of allTasks) {
      const start = t.startDate ?? t.date
      const end = t.dueDate ?? t.startDate ?? t.date
      const startD = new Date(start)
      const endD = new Date(end)
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split('T')[0]
        if (!map[ds]) map[ds] = []
        map[ds].push(t)
      }
    }
    return map
  }, [allTasks])

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((v) => v - 1)}
            className="px-2 py-1 rounded-md border border-border hover:bg-accent text-sm"
          >
            ← 이전
          </button>
          <h3 className="text-base font-semibold">
            {year}년 {month + 1}월
          </h3>
          <button
            onClick={() => setMonthOffset((v) => v + 1)}
            className="px-2 py-1 rounded-md border border-border hover:bg-accent text-sm"
          >
            다음 →
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            className="px-2 py-1 rounded-md border border-pink-300 bg-pink-50 dark:bg-pink-950 text-sm text-pink-700 dark:text-pink-300"
          >
            오늘
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          📅 모든 task 캘린더 보기 — 클릭 시 해당 날짜 보드로 이동
        </p>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 bg-card border border-border rounded-lg p-2">
        {/* Weekday header */}
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-semibold py-1.5',
              i === 0 && 'text-rose-500',
              i === 6 && 'text-blue-500'
            )}
          >
            {day}
          </div>
        ))}
        {/* Days */}
        {cells.map((cell, idx) => {
          const cellTasks = tasksByDate[cell.date] ?? []
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                'min-h-[100px] p-1 rounded-md border text-left transition-all hover:border-pink-400',
                !cell.isCurrentMonth && 'opacity-40 bg-muted/30',
                cell.isToday && 'border-pink-500 ring-2 ring-pink-200 dark:ring-pink-900',
                cell.isSelected && !cell.isToday && 'border-violet-500 bg-violet-50 dark:bg-violet-950',
                !cell.isToday && !cell.isSelected && 'border-border bg-card',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs font-medium',
                  cell.isToday && 'text-pink-600 dark:text-pink-400 font-bold'
                )}>
                  {cell.date.slice(8, 10)}
                  {cell.isToday && <span className="text-[9px] ml-1">오늘</span>}
                </span>
                {cellTasks.length > 0 && (
                  <span className="text-[9px] text-muted-foreground tabular-nums">{cellTasks.length}</span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {cellTasks.slice(0, 3).map((t) => {
                  const cardColor = (t.cardColor ?? 'default') as TaskCardColor
                  const palette = TASK_CARD_COLOR_PALETTE[cardColor]
                  const isMultiDayBar = t.multiDay && t.startDate && t.dueDate && t.startDate !== t.dueDate
                  const isStartDay = t.startDate === cell.date
                  const isEndDay = t.dueDate === cell.date
                  return (
                    <div
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); onSelectDate(cell.date); void onUpdateTask }}
                      className={cn(
                        'px-1 py-0.5 rounded text-[9px] truncate border-l-2 leading-tight',
                        palette.bg, palette.border,
                        t.status === 'Done' && 'line-through opacity-60',
                        isMultiDayBar && (isStartDay ? 'rounded-r-none' : isEndDay ? 'rounded-l-none' : 'rounded-none')
                      )}
                      title={t.title}
                    >
                      {t.emoji ?? '📌'} {t.title || '(제목 없음)'}
                    </div>
                  )
                })}
                {cellTasks.length > 3 && (
                  <p className="text-[9px] text-muted-foreground px-1">+{cellTasks.length - 3}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        ※ Multi-day task는 시작일~마감일 모든 날짜에 표시됩니다. 날짜 셀 클릭 시 해당 날짜 보드로 이동.
      </p>
    </div>
  )
}

// ============================================================================
// All Tasks View (Phase H — 날짜 무관 검색/필터)
// ============================================================================
function AllTasksView({
  allTasks, onUpdateTask, onRemoveTask, onSelectDate,
}: {
  allTasks: Task[]
  onUpdateTask: (id: string, patch: Partial<Task>) => void
  onRemoveTask: (id: string) => void
  onSelectDate: (d: string) => void
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [krFilter, setKrFilter] = useState<string>('all') // 'all' / krId / 'unlinked'
  const [importanceFilter, setImportanceFilter] = useState<number | 'all'>('all')
  const { availableKrs } = useOkr()
  // Phase M — Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return allTasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (krFilter === 'unlinked' && t.linkedKrId) return false
      if (krFilter !== 'all' && krFilter !== 'unlinked' && t.linkedKrId !== krFilter) return false
      if (importanceFilter !== 'all' && t.importance !== importanceFilter) return false
      return true
    }).sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date))
  }, [allTasks, query, statusFilter, krFilter, importanceFilter])

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap bg-card border border-border rounded-lg p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔎 task 제목 검색..."
          className="flex-1 min-w-[200px] px-2 py-1.5 rounded-md border border-input bg-background text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
          className="px-2 py-1.5 rounded-md border border-input bg-background text-xs"
        >
          <option value="all">상태 전체</option>
          {C6_STATUS_DEFS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
        <select
          value={krFilter}
          onChange={(e) => setKrFilter(e.target.value)}
          className="px-2 py-1.5 rounded-md border border-input bg-background text-xs"
        >
          <option value="all">KR 전체</option>
          <option value="unlinked">미연결</option>
          {availableKrs.map((k) => (
            <option key={k.id} value={k.id}>{k.title.slice(0, 25)}</option>
          ))}
        </select>
        <select
          value={String(importanceFilter)}
          onChange={(e) => {
            const v = e.target.value
            setImportanceFilter(v === 'all' ? 'all' : Number(v))
          }}
          className="px-2 py-1.5 rounded-md border border-input bg-background text-xs"
        >
          <option value="all">중요도 전체</option>
          <option value="3">⭐⭐⭐</option>
          <option value="2">⭐⭐</option>
          <option value="1">⭐</option>
        </select>
        <span className="text-xs text-muted-foreground tabular-nums ml-auto">
          {filtered.length} / {allTasks.length}건
        </span>
      </div>

      {/* Phase M — Bulk action bar (선택된 task 있을 때만) */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-pink-50 dark:bg-pink-950 border-2 border-pink-300 dark:border-pink-700 rounded-lg p-3">
          <span className="text-sm font-semibold text-pink-700 dark:text-pink-300">
            ✨ {selectedIds.size}건 선택됨
          </span>
          <span className="text-xs text-muted-foreground">→ 일괄 변경:</span>
          <select
            onChange={(e) => {
              const newStatus = e.target.value as TaskStatus
              if (!newStatus) return
              selectedIds.forEach((id) => {
                onUpdateTask(id, { status: newStatus })
              })
              toast.success(`${selectedIds.size}건 → ${newStatus}로 변경`)
              setSelectedIds(new Set())
            }}
            value=""
            className="px-2 py-1 rounded-md border border-input bg-background text-xs"
          >
            <option value="">상태 변경 ▼</option>
            {C6_STATUS_DEFS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <select
            onChange={(e) => {
              const krId = e.target.value
              if (!krId) return
              selectedIds.forEach((id) => {
                onUpdateTask(id, { linkedKrId: krId === 'unlink' ? undefined : krId })
              })
              toast.success(`${selectedIds.size}건 KR 매핑 ${krId === 'unlink' ? '해제' : '변경'}`)
              setSelectedIds(new Set())
            }}
            value=""
            className="px-2 py-1 rounded-md border border-input bg-background text-xs"
          >
            <option value="">KR 매핑 ▼</option>
            <option value="unlink">매핑 해제</option>
            {availableKrs.map((k) => (
              <option key={k.id} value={k.id}>{k.title.slice(0, 25)}</option>
            ))}
          </select>
          <select
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              const importance = Number(v) as 1 | 2 | 3
              selectedIds.forEach((id) => {
                onUpdateTask(id, { importance })
              })
              toast.success(`${selectedIds.size}건 중요도 변경`)
              setSelectedIds(new Set())
            }}
            value=""
            className="px-2 py-1 rounded-md border border-input bg-background text-xs"
          >
            <option value="">중요도 변경 ▼</option>
            <option value="3">⭐⭐⭐</option>
            <option value="2">⭐⭐</option>
            <option value="1">⭐</option>
          </select>
          <button
            onClick={() => {
              if (!confirm(`${selectedIds.size}건 일괄 삭제 — 되돌릴 수 없습니다.\n계속하시겠습니까?`)) return
              selectedIds.forEach((id) => onRemoveTask(id))
              toast.success(`${selectedIds.size}건 삭제됨`)
              setSelectedIds(new Set())
            }}
            className="px-2 py-1 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-xs"
          >
            🗑 일괄 삭제
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Task list (compact) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[28px_100px_1fr_120px_100px_80px_24px] gap-2 px-3 py-2 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <input
            type="checkbox"
            checked={filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id))}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(filtered.map((t) => t.id)))
              } else {
                setSelectedIds(new Set())
              }
            }}
            className="w-3.5 h-3.5"
            title="전체 선택"
          />
          <span>날짜</span>
          <span>제목</span>
          <span>KR</span>
          <span>상태</span>
          <span className="text-center">⭐</span>
          <span></span>
        </div>
        {filtered.map((t) => {
          const linkedKr = t.linkedKrId ? availableKrs.find((k) => k.id === t.linkedKrId) : null
          const sd = t.startDate ?? t.date
          const dd = t.dueDate ?? sd
          const isMultiDay = t.multiDay && sd !== dd
          const isSelected = selectedIds.has(t.id)
          return (
            <div
              key={t.id}
              className={cn(
                'grid grid-cols-[28px_100px_1fr_120px_100px_80px_24px] gap-2 px-3 py-2 border-b border-border last:border-b-0 hover:bg-accent/30 items-center text-sm',
                isSelected && 'bg-pink-50 dark:bg-pink-950/30'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    if (e.target.checked) next.add(t.id)
                    else next.delete(t.id)
                    return next
                  })
                }}
                className="w-3.5 h-3.5"
              />
              <button
                onClick={() => onSelectDate(sd)}
                className="text-xs text-left truncate text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isMultiDay ? `${sd.slice(5)}~${dd.slice(5)}` : sd.slice(5)}
              </button>
              <button
                onClick={() => onSelectDate(sd)}
                className="text-left truncate hover:text-pink-600"
              >
                {t.emoji ?? '📌'} {t.title || '(제목 없음)'}
              </button>
              <span className="text-xs truncate">
                {linkedKr ? (
                  <span className="text-violet-600 dark:text-violet-400">🎯 {linkedKr.title.slice(0, 15)}</span>
                ) : (
                  <span className="text-muted-foreground italic">미연결</span>
                )}
              </span>
              <span className="text-xs">{t.status}</span>
              <span className="text-center text-xs">{Array(t.importance ?? 1).fill('⭐').join('')}</span>
              <button
                onClick={() => onRemoveTask(t.id)}
                className="text-muted-foreground hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">조건에 맞는 task 없음</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Board View (Phase G — Kanban 4 컬럼, drag & drop status 변경)
// ============================================================================
const BOARD_COLUMNS: { status: TaskStatus; label: string; emoji: string; gradient: string }[] = [
  { status: 'Planned',    label: 'To Do',       emoji: '📋', gradient: 'from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950' },
  { status: 'InProgress', label: 'In Progress', emoji: '⚡', gradient: 'from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-950/30' },
  { status: 'Waiting',    label: 'Waiting',     emoji: '⏸', gradient: 'from-amber-100 to-amber-50 dark:from-amber-950 dark:to-amber-950/30' },
  { status: 'Done',       label: 'Done ✨',      emoji: '✅', gradient: 'from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-emerald-950/30' },
  // Round 16: Blocked 컬럼 제거 (Waiting으로 통합)
]

function BoardView({
  tasks, onUpdate, onRemove, onAdd,
}: {
  tasks: Task[]
  onUpdate: (id: string, patch: Partial<Task>) => void
  onRemove: (id: string) => void
  onAdd: (status: TaskStatus) => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)

  const onDrop = (toStatus: TaskStatus) => {
    if (!draggingId) return
    const task = tasks.find((t) => t.id === draggingId)
    if (!task) return
    if (toStatus === task.status) { setDraggingId(null); setDragOverCol(null); return }
    if (toStatus === 'Done') {
      onUpdate(task.id, { status: 'Done', doneAt: new Date().toISOString() })
      toast.success('완료! ✨')
    } else {
      onUpdate(task.id, { status: toStatus })
    }
    setDraggingId(null)
    setDragOverCol(null)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {BOARD_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        const isDragOver = dragOverCol === col.status
        return (
          <div
            key={col.status}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status) }}
            onDragLeave={() => setDragOverCol((c) => c === col.status ? null : c)}
            onDrop={() => onDrop(col.status)}
            className={cn(
              'rounded-2xl border-2 p-2 min-h-[300px] bg-gradient-to-b transition-all',
              col.gradient,
              isDragOver ? 'border-pink-400 scale-[1.02]' : 'border-transparent'
            )}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold flex items-center gap-1">
                {col.emoji} {col.label}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 tabular-nums">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={cn(
                    'p-2 rounded-xl border-2 bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing text-xs transition-all',
                    TASK_CARD_COLOR_PALETTE[(task.cardColor ?? 'default') as TaskCardColor].border,
                    draggingId === task.id && 'opacity-40 rotate-1'
                  )}
                >
                  <div className="flex items-start gap-1">
                    <span>{task.emoji ?? '📌'}</span>
                    <p className="flex-1 font-medium leading-tight">{task.title || '(제목 없음)'}</p>
                    <button onClick={() => onRemove(task.id)} className="opacity-50 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap text-[9px]">
                    <span className="px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {Array(task.importance ?? 1).fill('⭐').join('')}
                    </span>
                    {task.linkedKrId && (
                      <span className="px-1 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                        🎯 KR
                      </span>
                    )}
                    {task.multiDay && task.dueDate && (
                      <span className="px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        📆 ~{task.dueDate.slice(5)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => onAdd(col.status)}
                className="w-full text-[10px] py-1.5 border-2 border-dashed border-pink-200 dark:border-pink-900 rounded-lg hover:border-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 text-muted-foreground hover:text-pink-600"
              >
                + 추가
              </button>
            </div>
          </div>
        )
      })}
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
