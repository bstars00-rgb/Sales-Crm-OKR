import { useMemo, useState } from 'react'
import { Users, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useActivityStore } from '@/contexts/ActivityStore'
import { mockUsers } from '@/mocks/users'
import type { User } from '@/types'

/**
 * Manager 이상에게만 노출 — 본인 팀(또는 권역)의 팀원 Critical 6 진척 + 오늘 Activity 수.
 * PL-003 수용 — 직급별 데모 효과 강화.
 */
export default function TeamProgressPanel() {
  const { user, isAtLeast } = useAuth()
  const { tasks, activities } = useActivityStore()
  const [drilldownUser, setDrilldownUser] = useState<User | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const teamMembers = useMemo(() => {
    if (!user || !isAtLeast('part_manager')) return []
    if (isAtLeast('director')) {
      return mockUsers.filter((u) => u.role === 'team_member')
    }
    if (user.role === 'team_manager') {
      return mockUsers.filter((u) => u.role === 'team_member' && u.region === user.region)
    }
    if (user.role === 'part_manager' && user.partId) {
      return mockUsers.filter((u) => u.role === 'team_member' && u.partId === user.partId)
    }
    return []
  }, [user, isAtLeast])

  if (!user || !isAtLeast('part_manager')) return null

  if (teamMembers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">팀원 진척률</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          현재 등록된 팀원이 없습니다. Settings에서 팀원을 추가하세요.
        </p>
      </div>
    )
  }

  const rows = teamMembers.map((m) => {
    const todayTasks = tasks.filter((t) => t.ownerUserId === m.id && t.date === today)
    const doneCount = todayTasks.filter((t) => t.status === 'Done').length
    const totalCount = todayTasks.length
    const todayActivities = activities.filter(
      (a) => a.authorUserId === m.id && a.occurredAt.slice(0, 10) === today
    ).length
    const carryOver = todayTasks.filter((t) => t.carryOver).length
    return {
      user: m,
      doneCount,
      totalCount,
      todayActivities,
      carryOver,
      pct: totalCount > 0 ? (doneCount / totalCount) * 100 : 0,
    }
  })

  const teamDone = rows.reduce((s, r) => s + r.doneCount, 0)
  const teamTotal = rows.reduce((s, r) => s + r.totalCount, 0)
  const teamActivities = rows.reduce((s, r) => s + r.todayActivities, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">팀원 진척률</h3>
          <span className="text-xs text-muted-foreground">
            {teamMembers.length}명 · 오늘 Critical 6 {teamDone}/{teamTotal} · Activity {teamActivities}건
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <button
            key={r.user.id}
            onClick={() => setDrilldownUser(r.user)}
            aria-label={`${r.user.name} 진척률 상세 보기`}
            className="w-full text-left flex items-center gap-3 p-2 rounded-lg border border-border bg-background hover:border-foreground/40 hover:bg-accent/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {r.user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{r.user.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {r.doneCount}/{r.totalCount} · {r.pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    r.pct >= 80 ? 'bg-emerald-500' : r.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Done {r.doneCount}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Circle className="w-2.5 h-2.5" /> Total {r.totalCount}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  Activity {r.todayActivities}건
                </span>
                {r.carryOver > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-2.5 h-2.5" /> 이월 {r.carryOver}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Drilldown Modal (PL-R3-003) */}
      {drilldownUser && (
        <DrilldownModal
          targetUser={drilldownUser}
          tasks={tasks.filter((t) => t.ownerUserId === drilldownUser.id && t.date === today)}
          activitiesCount={activities.filter((a) => a.authorUserId === drilldownUser.id && a.occurredAt.slice(0, 10) === today).length}
          onClose={() => setDrilldownUser(null)}
        />
      )}
    </div>
  )
}

interface DrilldownProps {
  targetUser: User
  tasks: ReturnType<ReturnType<typeof useActivityStore>['getTasksByOwner']>
  activitiesCount: number
  onClose: () => void
}

function DrilldownModal({ targetUser, tasks, activitiesCount, onClose }: DrilldownProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h3 className="text-base font-semibold">{targetUser.name} — 오늘 진척</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {targetUser.role} · {targetUser.region ?? '-'} · Activity {activitiesCount}건
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">오늘 등록된 Critical 6 없음</p>
          ) : (
            <ul className="space-y-2">
              {tasks.sort((a, b) => a.rank - b.rank).map((t) => (
                <li key={t.id} className="flex items-start gap-2 p-2 rounded border border-border">
                  <span className="text-xs font-mono text-muted-foreground shrink-0">#{t.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        t.status === 'Done' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      )}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{t.category}</span>
                      {t.carryOver && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-2.5 h-2.5" /> 이월
                        </span>
                      )}
                    </div>
                    <p className={cn('text-sm font-medium mt-0.5', t.status === 'Done' && 'line-through text-muted-foreground')}>
                      {t.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-end px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-border hover:bg-accent"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
