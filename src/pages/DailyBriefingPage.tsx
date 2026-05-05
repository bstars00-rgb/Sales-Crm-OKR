import { useEffect, useState } from 'react'
import { Share2, Copy, AlertTriangle, AlertCircle, Info, Clock, CheckCircle2, Send, Edit, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockBriefing } from '@/mocks/briefing'
import { formatCurrency } from '@/utils/kpiCalc'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import type { AlertSeverity } from '@/types'
import Critical6Section from '@/components/daily-briefing/Critical6Section'
import TeamProgressPanel from '@/components/daily-briefing/TeamProgressPanel'

type BriefingState = {
  status: 'Draft' | 'Submitted' | 'EditRequested'
  submittedAt: number | null
  submittedByUserId: string | null // self-approval 차단용 (PL-R2-002)
  comment: string
  issues: string
  tomorrowActions: string
}

const DEFAULT_STATE: BriefingState = {
  status: 'Draft',
  submittedAt: null,
  submittedByUserId: null,
  comment: '',
  issues: '',
  tomorrowActions: '',
}

const storageKey = (userId: string, date: string) => `sales-crm:briefing-state:${userId}:${date}`

function loadState(userId: string | null, date: string): BriefingState {
  if (!userId) return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(storageKey(userId, date))
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_STATE
}

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
  high: { bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50', text: 'text-orange-700 dark:text-orange-400', icon: AlertCircle },
  medium: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
  warning: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
  info: { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50', text: 'text-blue-700 dark:text-blue-400', icon: Info },
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

const PRIORITY_LABELS: Record<string, string> = {
  high: '긴급',
  medium: '보통',
  low: '낮음',
}

export default function DailyBriefingPage() {
  const { user } = useAuth()
  const briefing = mockBriefing
  const formattedDate = new Date(briefing.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const briefingDate = briefing.date
  const [state, setState] = useState<BriefingState>(() => loadState(user?.id ?? null, briefingDate))
  const [now, setNow] = useState(Date.now())

  // user/date 변경 시 해당 사용자의 상태로 다시 로드
  useEffect(() => {
    setState(loadState(user?.id ?? null, briefingDate))
  }, [user?.id, briefingDate])

  useEffect(() => {
    if (!user) return
    localStorage.setItem(storageKey(user.id, briefingDate), JSON.stringify(state))
  }, [state, user, briefingDate])

  // 24시간 윈도우 카운트다운 (BR-004-4) — 1분 간격 갱신, 60초 미만 시 30초로 미세화
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const within24h = state.submittedAt !== null && now - state.submittedAt < 24 * 3600 * 1000
  const remainingMs = state.submittedAt ? 24 * 3600 * 1000 - (now - state.submittedAt) : 0
  const remainingLabel = (() => {
    if (!state.submittedAt) return ''
    const totalMin = Math.max(0, Math.floor(remainingMs / 60_000))
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    if (h > 0) return `${h}h ${m}m 남음`
    return `${m}분 남음`
  })()

  // 본인 마감 본인 승인 차단 (PL-R2-002)
  const canApproveEdit =
    state.status === 'EditRequested' &&
    user &&
    state.submittedByUserId !== user.id &&
    (user.role === 'team_manager' ||
      user.role === 'part_manager' ||
      user.role === 'director' ||
      user.role === 'regional_director' ||
      user.role === 'c_level' ||
      user.role === 'ceo')

  const handleSubmit = () => {
    if (!user) return
    setState((s) => ({ ...s, status: 'Submitted', submittedAt: Date.now(), submittedByUserId: user.id }))
    toast.success('Daily Briefing 마감 완료', {
      description: '24시간 이내 본인 자유 수정 가능. 이후 Manager 승인 필요.',
    })
  }
  const handleEditRequest = () => {
    setState((s) => ({ ...s, status: 'EditRequested' }))
    toast('수정 요청 발송', { description: 'Manager 승인 시 Draft 복귀' })
  }
  const handleManagerApprove = () => {
    if (!canApproveEdit) {
      toast.error('본인이 마감한 보고는 본인이 승인할 수 없습니다 (self-approval 차단)')
      return
    }
    setState((s) => ({ ...s, status: 'Draft', submittedAt: null, submittedByUserId: null }))
    toast.success('Manager 승인 — Draft 복귀, 재마감 가능')
  }
  const handleShare = () => toast.info('공유 기능 준비 중')
  const handleCopy = () => {
    navigator.clipboard.writeText(`Daily Briefing - ${briefing.date}`).catch(() => {})
    toast.success('클립보드에 복사됨')
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Critical 6
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                PRD v1 (docs/specs/critical-6/)
              </span>
            </h2>
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded',
                state.status === 'Draft' && 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
                state.status === 'Submitted' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                state.status === 'EditRequested' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}
            >
              {state.status === 'Draft' ? 'DRAFT' : state.status === 'Submitted' ? 'SUBMITTED' : 'EDIT REQUESTED'}
            </span>
            {state.status === 'Submitted' && within24h && (
              <span className="text-[10px] text-muted-foreground">24h 윈도우 — {remainingLabel}</span>
            )}
            {state.status === 'Submitted' && !within24h && (
              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Lock className="w-3 h-3" /> 24h 경과 — Manager 승인 필요
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {state.status === 'Draft' && (
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Send className="w-4 h-4" />
              마감
            </button>
          )}
          {state.status === 'Submitted' && !within24h && (
            <button
              onClick={handleEditRequest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
            >
              <Edit className="w-4 h-4" />
              수정 요청
            </button>
          )}
          {canApproveEdit && (
            <button
              onClick={handleManagerApprove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600"
            >
              <CheckCircle2 className="w-4 h-4" />
              Manager 승인
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
          >
            <Share2 className="w-4 h-4" />
            공유
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
          >
            <Copy className="w-4 h-4" />
            복사
          </button>
        </div>
      </div>

      {/* EditRequested 본인 시점 안내 (PL-R3-006) */}
      {state.status === 'EditRequested' && state.submittedByUserId === user?.id && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <strong>수정 요청 발송됨</strong> — Manager 승인 대기 중입니다. (Team Manager / Director 등에게 알림 전달)
            <p className="text-xs text-muted-foreground mt-0.5">
              승인되면 Draft로 복귀하여 재마감 가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* Critical 6 Section (FR-002) */}
      <Critical6Section />

      {/* Team Progress (Manager 이상만, FR-002 + US-005) */}
      <TeamProgressPanel />

      {/* KPI Change Cards */}
      <section>
        <h3 className="text-sm font-semibold mb-3">주요 지표 변동</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {briefing.kpiChanges.map((kpi) => {
            const isPositive = kpi.changePercent >= 0
            return (
              <div key={kpi.metric} className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{kpi.metric}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-bold">
                    {kpi.metric === 'TTV'
                      ? formatCurrency(kpi.today)
                      : kpi.today.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    전일:{' '}
                    {kpi.metric === 'TTV'
                      ? formatCurrency(kpi.yesterday)
                      : kpi.yesterday.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      'font-semibold px-1.5 py-0.5 rounded',
                      isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                    )}
                  >
                    {isPositive ? '+' : ''}
                    {kpi.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Clients */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">긴급 클라이언트</h3>
          <div className="space-y-2">
            {(briefing.urgentClients ?? []).map((uc) => {
              const style = SEVERITY_STYLES[uc.severity]
              const Icon = style.icon
              return (
                <div
                  key={uc.clientId}
                  className={cn('flex items-start gap-3 p-3 rounded-md border', style.bg)}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', style.text)} />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold', style.text)}>{uc.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{uc.reason}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Today's Schedule */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">오늘 일정</h3>
          <div className="space-y-2">
            {(briefing.todaySchedule ?? []).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent transition-colors"
              >
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-mono text-muted-foreground w-12 shrink-0">
                  {item.time}
                </span>
                <span className="text-sm flex-1">{item.title}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  item.type === 'meeting' && 'bg-blue-50 text-blue-700',
                  item.type === 'review' && 'bg-amber-50 text-amber-700',
                  item.type === 'internal' && 'bg-gray-100 text-gray-600'
                )}>
                  {item.type === 'meeting' ? '미팅' : item.type === 'review' ? '검토' : '내부'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Action Items */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Action Items</h3>
        <div className="space-y-2">
          {(briefing.actionItems ?? []).map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.description}</p>
                {item.clientName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.clientName}</p>
                )}
              </div>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                  PRIORITY_STYLES[item.priority].bg,
                  PRIORITY_STYLES[item.priority].text
                )}
              >
                {PRIORITY_LABELS[item.priority]}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
