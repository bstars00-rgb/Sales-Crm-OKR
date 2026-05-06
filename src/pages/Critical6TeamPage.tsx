// Critical 6 Team Compact View — Round 16 Phase C
// 팀장이 6명 × N task = 한 줄로 빠르게 파악 (5분 점검 룰)

import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  CheckCircle2, AlertTriangle, Clock, Pause, Circle,
  Users, ArrowUpDown, ChevronRight, Target as TargetIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  mockCritical6Tasks, getTodayTasksByUser, getUserProgress,
  C6_STATUS_DEFS,
} from '@/mocks/critical6'
import { mockUsers } from '@/mocks/users'
import { mockKeyResults, mockContributions } from '@/mocks/okr'
import type { Task, TaskStatus } from '@/types'

const TEAM_USER_IDS = ['u-sales-1', 'u-sales-2', 'u-sales-3', 'u-sales-4', 'u-sales-5', 'u-sales-6']

type SortKey = 'risk' | 'progress' | 'name'

export default function Critical6TeamPage() {
  const [sortKey, setSortKey] = useState<SortKey>('risk')

  // 팀원별 task + KR 연결 분석
  const teamRows = useMemo(() => {
    return TEAM_USER_IDS.map((uid) => {
      const tasks = getTodayTasksByUser(uid)
      const user = mockUsers.find((u) => u.id === uid) ?? { id: uid, name: uid, role: 'team_member' as const }
      const progress = getUserProgress(uid)
      const blocked = tasks.filter((t) => t.status === 'Blocked')
      const waiting = tasks.filter((t) => t.status === 'Waiting')
      const overdueCarry = tasks.filter((t) => (t.carryCount ?? 0) >= 3)
      // 가장 위급한 이슈 메시지
      let alert: { level: 'red' | 'amber' | 'green' | 'gray'; msg: string } = { level: 'green', msg: '정상' }
      if (blocked.length > 0) {
        const days = Math.floor(Math.random() * 4) + 1 // 시연용 1~4일
        alert = { level: 'red', msg: `Blocked: ${blocked[0].blockedReason ?? '사유 미입력'} (${days}d)` }
      } else if (overdueCarry.length > 0) {
        alert = { level: 'amber', msg: `${overdueCarry[0].carryCount}회 반복 이월: ${overdueCarry[0].title}` }
      } else if (waiting.length > 1) {
        alert = { level: 'amber', msg: `대기 중 ${waiting.length}건` }
      } else if (tasks.length === 0) {
        alert = { level: 'gray', msg: '오늘 미작성' }
      }
      // KR 매핑된 contribution 수
      const krContribs = mockContributions.filter((c) => c.ownerId === uid && c.contributionType === 'critical6_task')
      const linkedKrIds = [...new Set(krContribs.map((c) => c.krId))]
      const primaryKr = linkedKrIds.length > 0 ? mockKeyResults.find((k) => k.id === linkedKrIds[0]) : null
      // 마지막 업데이트 (시연용)
      const lastUpdate = tasks.length > 0
        ? tasks.reduce<string>((acc, t) => (t.updatedAt > acc ? t.updatedAt : acc), tasks[0].updatedAt)
        : null

      return {
        userId: uid,
        userName: user.name,
        userRole: user.role,
        tasks,
        progress,
        blocked,
        waiting,
        alert,
        primaryKr,
        linkedKrCount: linkedKrIds.length,
        lastUpdate,
      }
    })
  }, [])

  const sortedRows = useMemo(() => {
    const rows = [...teamRows]
    if (sortKey === 'risk') {
      const order = { red: 0, amber: 1, gray: 2, green: 3 }
      rows.sort((a, b) => order[a.alert.level] - order[b.alert.level])
    } else if (sortKey === 'progress') {
      rows.sort((a, b) => a.progress.completionRate - b.progress.completionRate)
    } else {
      rows.sort((a, b) => a.userName.localeCompare(b.userName))
    }
    return rows
  }, [teamRows, sortKey])

  const teamStats = useMemo(() => {
    const totalTasks = teamRows.reduce((sum, r) => sum + r.tasks.length, 0)
    const totalDone = teamRows.reduce((sum, r) => sum + r.progress.done, 0)
    const totalBlocked = teamRows.reduce((sum, r) => sum + r.blocked.length, 0)
    const submitted = teamRows.filter((r) => r.tasks.length > 0).length
    return { totalTasks, totalDone, totalBlocked, submitted, total: teamRows.length }
  }, [teamRows])

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team Critical 6 — Sales East Asia
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            팀장 5분 점검 룰 — {teamStats.submitted}/{teamStats.total} 명 작성 ·{' '}
            완료 {teamStats.totalDone}/{teamStats.totalTasks} ·{' '}
            <span className={cn(teamStats.totalBlocked > 0 ? 'text-rose-500' : 'text-muted-foreground')}>
              Blocked {teamStats.totalBlocked}건
            </span>
          </p>
        </div>
        {/* Sort */}
        <div className="flex items-center gap-1 text-xs">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          {(['risk', 'progress', 'name'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={cn(
                'px-2 py-1 rounded-md',
                sortKey === k ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
              )}
            >
              {k === 'risk' && '위험도'}
              {k === 'progress' && '진척률'}
              {k === 'name' && '이름'}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Team Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Column header */}
        <div className="grid grid-cols-[140px_60px_1fr_180px_140px_24px] gap-3 px-4 py-2 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <span>팀원</span>
          <span className="text-center">진척</span>
          <span>Status 분포</span>
          <span>주 KR</span>
          <span>알림</span>
          <span></span>
        </div>

        {/* Rows — 1명 = 1줄 */}
        {sortedRows.map((row) => (
          <Link
            key={row.userId}
            to="/critical6"
            className={cn(
              'grid grid-cols-[140px_60px_1fr_180px_140px_24px] gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors items-center',
              row.alert.level === 'red' && 'bg-rose-50/30 dark:bg-rose-950/10',
              row.alert.level === 'amber' && 'bg-amber-50/30 dark:bg-amber-950/10',
              row.alert.level === 'gray' && 'bg-muted/20'
            )}
          >
            {/* 팀원 이름 + 직급 */}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{getRoleLabel(row.userRole)}</p>
            </div>

            {/* 진척 X/Y */}
            <div className="text-center">
              <span className="tabular-nums text-sm font-medium">
                {row.progress.done}/{row.tasks.length}
              </span>
            </div>

            {/* Status 분포 — 작은 도트들로 */}
            <div className="flex items-center gap-1 flex-wrap">
              {row.tasks.length === 0 ? (
                <span className="text-xs text-muted-foreground">미작성</span>
              ) : (
                <>
                  {row.tasks.slice(0, 12).map((t) => (
                    <StatusDot key={t.id} status={t.status} />
                  ))}
                  {row.tasks.length > 12 && (
                    <span className="text-[10px] text-muted-foreground">+{row.tasks.length - 12}</span>
                  )}
                </>
              )}
            </div>

            {/* 주 KR */}
            <div className="min-w-0">
              {row.primaryKr ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <TargetIcon className="w-3 h-3 text-violet-500 shrink-0" />
                  <span className="truncate text-violet-600 dark:text-violet-400">{row.primaryKr.title}</span>
                  {row.linkedKrCount > 1 && (
                    <span className="text-[10px] text-muted-foreground">+{row.linkedKrCount - 1}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">미연결</span>
              )}
            </div>

            {/* 알림 */}
            <div className={cn(
              'text-xs truncate',
              row.alert.level === 'red' && 'text-rose-600 dark:text-rose-400 font-medium',
              row.alert.level === 'amber' && 'text-amber-600 dark:text-amber-400',
              row.alert.level === 'green' && 'text-emerald-600 dark:text-emerald-400',
              row.alert.level === 'gray' && 'text-muted-foreground'
            )}>
              {row.alert.level === 'red' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {row.alert.msg}
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Footer guide */}
      <p className="text-[10px] text-muted-foreground">
        ※ Critical 6 PRD v1.4 (Round 16) — 팀장 5분 점검 룰. 1명 = 1줄. 위험도순 정렬 디폴트.
        팀원 클릭 시 본인 보드 (꾸민 그대로) drill-down. Status 분포는 6개 dot로 시각화.
      </p>
    </div>
  )
}

// Status별 도트 (color + 아이콘)
function StatusDot({ status }: { status: TaskStatus }) {
  const def = C6_STATUS_DEFS.find((s) => s.code === status)
  const conf: Record<TaskStatus, { bg: string; icon: React.ReactNode; label: string }> = {
    Planned: { bg: 'bg-slate-300 dark:bg-slate-600', icon: <Circle className="w-2.5 h-2.5 text-white" />, label: 'To Do' },
    InProgress: { bg: 'bg-blue-500', icon: <Clock className="w-2.5 h-2.5 text-white" />, label: 'Doing' },
    Waiting: { bg: 'bg-amber-500', icon: <Pause className="w-2.5 h-2.5 text-white" />, label: 'Waiting' },
    Done: { bg: 'bg-emerald-500', icon: <CheckCircle2 className="w-2.5 h-2.5 text-white" />, label: 'Done' },
    Blocked: { bg: 'bg-rose-500', icon: <AlertTriangle className="w-2.5 h-2.5 text-white" />, label: 'Blocked' },
    Skipped: { bg: 'bg-slate-400', icon: <Circle className="w-2.5 h-2.5 text-white" />, label: 'Skipped' },
  }
  const c = conf[status]
  return (
    <span
      className={cn('w-4 h-4 rounded-full flex items-center justify-center', c.bg)}
      title={`${c.label} - ${def?.label ?? status}`}
    >
      {c.icon}
    </span>
  )
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ceo: 'CEO',
    c_level: 'C-Level',
    regional_director: 'Regional Director',
    director: 'Director',
    team_manager: 'TM',
    part_manager: 'PM',
    team_member: 'Team Member',
  }
  return map[role] ?? role
}

// suppress unused
void mockCritical6Tasks
