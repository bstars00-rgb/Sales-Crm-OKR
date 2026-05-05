/**
 * Activity + Task 통합 상태 저장소.
 * - Critical 6 Task 완료 시 Activity 자동 생성 (BR-002-5)
 * - relatedTaskId 연결로 Channel Detail Tasks 탭과 Activity Timeline 양방향 동기화 (AC-003-4)
 * - Subscribe 패턴으로 모든 컴포넌트가 동일 상태 참조 (PL-002, QA-004)
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { mockActivities } from '@/mocks/activities'
import { mockTasks } from '@/mocks/tasks'
import { loadReport, teamActionsToActivities } from '@/services/reportData'
import { useAuth } from '@/contexts/AuthContext'
import type { Activity, ActivityType, Task, TaskCategory, TaskStatus, TaskRank } from '@/types'

interface ActivityStoreCtx {
  activities: Activity[]
  tasks: Task[]
  // Activity ops
  addActivity: (a: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Activity
  updateActivity: (id: string, patch: Partial<Activity>) => void
  deleteActivity: (id: string) => void // soft-delete
  getActivitiesByChannel: (channelId: string) => Activity[]
  // Task ops
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rank'> & { rank?: TaskRank }) => Task | null
  addBulkCarryOver: (taskIds: string[]) => { added: number; skipped: number } // 6개 한도 원자성
  updateTask: (id: string, patch: Partial<Task>) => void
  removeTask: (id: string) => void // 삭제 후 rank 재정렬
  toggleTaskDone: (id: string) => void // Done 시 Activity 자동 생성
  getTasksByOwner: (userId: string, date?: string) => Task[]
  getTasksByChannel: (channelId: string) => Task[]
}

const Ctx = createContext<ActivityStoreCtx | null>(null)

const TASK_CATEGORY_TO_ACTIVITY_TYPE: Record<TaskCategory, ActivityType> = {
  NewDeal: 'Note',
  Promotion: 'Promotion',
  Issue: 'Issue',
  Contract: 'Contract',
  Pipeline: 'Note',
  Internal: 'Note',
  'Follow-up': 'Note',
}

let activityCounter = 1000
let taskCounter = 1000
function nextActivityId() {
  return `a-${++activityCounter}`
}
function nextTaskId() {
  return `t-${++taskCounter}`
}

/** 테스트 격리용 — 카운터 초기화 (R2-002) */
export function resetActivityStoreCounters() {
  activityCounter = 1000
  taskCounter = 1000
}

export function ActivityStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>(mockActivities)
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  // 콜백 안에서 최신 state 참조용 (toggleTaskDone 내부)
  const tasksRef = useRef(tasks)
  const activitiesRef = useRef(activities)
  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { activitiesRef.current = activities }, [activities])

  // 실데이터 흡수: REPORT teamActions → Activity (1회만)
  useEffect(() => {
    let cancelled = false
    loadReport()
      .then((report) => {
        if (cancelled) return
        const realActs = teamActionsToActivities(report)
        setActivities((prev) => {
          const ids = new Set(prev.map((a) => a.id))
          const merged = [...prev, ...realActs.filter((a) => !ids.has(a.id))]
          return merged.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // ===== Activity ops =====
  const addActivity: ActivityStoreCtx['addActivity'] = useCallback((input) => {
    const now = new Date().toISOString()
    const a: Activity = { ...input, id: nextActivityId(), createdAt: now, updatedAt: now }
    setActivities((prev) => [a, ...prev])
    return a
  }, [])

  const updateActivity: ActivityStoreCtx['updateActivity'] = useCallback((id, patch) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)))
  }, [])

  const deleteActivity: ActivityStoreCtx['deleteActivity'] = useCallback((id) => {
    // soft-delete: 화면에서 제거하지만 운영에서는 deletedAt 설정 (MVP 단계는 hard remove)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const getActivitiesByChannel = useCallback(
    (channelId: string) =>
      activities.filter((a) => a.channelId === channelId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [activities]
  )

  // ===== Task ops =====
  const addTask: ActivityStoreCtx['addTask'] = useCallback(
    (input) => {
      if (!user) return null
      const owner = input.ownerUserId ?? user.id
      const date = input.date ?? new Date().toISOString().slice(0, 10)
      // 같은 사용자/날짜에서 6개 초과 차단
      const sameDay = tasks.filter((t) => t.ownerUserId === owner && t.date === date)
      if (sameDay.length >= 6) return null
      // rank 자동 할당: 가장 작은 빈 슬롯 (1~6)
      const used = new Set(sameDay.map((t) => t.rank))
      let rank: TaskRank = 1
      for (let r = 1; r <= 6; r++) {
        if (!used.has(r as TaskRank)) {
          rank = r as TaskRank
          break
        }
      }
      const now = new Date().toISOString()
      const t: Task = {
        ...input,
        id: nextTaskId(),
        ownerUserId: owner,
        date,
        rank,
        createdAt: now,
        updatedAt: now,
      }
      setTasks((prev) => [...prev, t])
      return t
    },
    [user, tasks]
  )

  /**
   * 어제 미완료 Task 일괄 carry-over (TS3-003 원자성).
   * tasks closure로 동기적 계산 → setTasks는 단순 append. setTasks updater의
   * 비동기 실행에 의존하지 않아 React 18 Strict Mode에서도 안전.
   */
  const addBulkCarryOver: ActivityStoreCtx['addBulkCarryOver'] = useCallback(
    (taskIds) => {
      if (!user) return { added: 0, skipped: taskIds.length }
      const today = new Date().toISOString().slice(0, 10)
      const targets = tasks.filter((t) => taskIds.includes(t.id))
      const sameDay = tasks.filter((t) => t.ownerUserId === user.id && t.date === today)
      const usedRanks = new Set(sameDay.map((t) => t.rank))
      const created: Task[] = []
      let added = 0
      let skipped = 0
      for (const target of targets) {
        if (sameDay.length + created.length >= 6) {
          skipped++
          continue
        }
        let rank: TaskRank = 1
        for (let r = 1; r <= 6; r++) {
          if (!usedRanks.has(r as TaskRank)) {
            rank = r as TaskRank
            usedRanks.add(rank)
            break
          }
        }
        const now = new Date().toISOString()
        created.push({
          id: nextTaskId(),
          ownerUserId: user.id,
          date: today,
          rank,
          channelId: target.channelId,
          category: target.category,
          title: target.title,
          expectedOutcome: target.expectedOutcome,
          status: 'Planned',
          carryOver: true,
          createdAt: now,
          updatedAt: now,
        })
        added++
      }
      if (created.length > 0) {
        setTasks((prev) => [...prev, ...created])
      }
      return { added, skipped }
    },
    [user, tasks]
  )

  const updateTask: ActivityStoreCtx['updateTask'] = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)))
  }, [])

  const removeTask: ActivityStoreCtx['removeTask'] = useCallback((id) => {
    // 삭제 후 같은 (ownerUserId, date) 그룹에서 rank 1..N으로 재정렬 (QA-003)
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id)
      const filtered = prev.filter((t) => t.id !== id)
      if (!target) return filtered
      const groupKey = (x: Task) => x.ownerUserId === target.ownerUserId && x.date === target.date
      const group = filtered
        .filter(groupKey)
        .sort((a, b) => a.rank - b.rank)
        .map((t, i) => ({ ...t, rank: ((i + 1) as TaskRank) }))
      return filtered.map((t) => group.find((g) => g.id === t.id) ?? t)
    })
  }, [])

  const toggleTaskDone: ActivityStoreCtx['toggleTaskDone'] = useCallback((id) => {
    // 함수형 setState로 stale closure 회피 (TS3-002)
    setTasks((prevTasks) => {
      const target = prevTasks.find((x) => x.id === id)
      if (!target) return prevTasks
      const now = new Date().toISOString()
      const nextStatus: TaskStatus = target.status === 'Done' ? 'InProgress' : 'Done'

      if (nextStatus === 'Done') {
        const newActivity: Activity = {
          id: nextActivityId(),
          channelId: target.channelId ?? 'c-internal',
          authorUserId: target.ownerUserId,
          type: TASK_CATEGORY_TO_ACTIVITY_TYPE[target.category],
          occurredAt: now,
          subject: target.title,
          content: target.expectedOutcome ?? `Critical 6 #${target.rank} 완료: ${target.title}`,
          action: target.resultNote,
          relatedTaskId: target.id,
          source: 'auto',
          createdAt: now,
          updatedAt: now,
        }
        setActivities((prevActs) => [newActivity, ...prevActs])
        return prevTasks.map((x) =>
          x.id === id
            ? {
                ...x,
                status: nextStatus,
                doneAt: now,
                doneActivityIds: [...(x.doneActivityIds ?? []), newActivity.id],
                updatedAt: now,
              }
            : x
        )
      }

      // Done → InProgress 회수 (PL-R2-004)
      const lastAutoId = target.doneActivityIds?.[target.doneActivityIds.length - 1]
      if (lastAutoId) {
        setActivities((prevActs) => {
          const auto = prevActs.find((a) => a.id === lastAutoId && a.source === 'auto')
          if (auto && Date.now() - new Date(auto.createdAt).getTime() < 5 * 60 * 1000) {
            return prevActs.filter((a) => a.id !== lastAutoId)
          }
          return prevActs
        })
      }
      return prevTasks.map((x) =>
        x.id === id
          ? {
              ...x,
              status: nextStatus,
              doneAt: undefined,
              doneActivityIds: x.doneActivityIds?.filter((a) => a !== lastAutoId),
              updatedAt: now,
            }
          : x
      )
    })
  }, [])

  const getTasksByOwner = useCallback(
    (userId: string, date?: string) => {
      const list = tasks.filter((t) => t.ownerUserId === userId)
      return date ? list.filter((t) => t.date === date) : list
    },
    [tasks]
  )

  const getTasksByChannel = useCallback(
    (channelId: string) => tasks.filter((t) => t.channelId === channelId),
    [tasks]
  )

  const value = useMemo<ActivityStoreCtx>(
    () => ({
      activities,
      tasks,
      addActivity,
      updateActivity,
      deleteActivity,
      getActivitiesByChannel,
      addTask,
      addBulkCarryOver,
      updateTask,
      removeTask,
      toggleTaskDone,
      getTasksByOwner,
      getTasksByChannel,
    }),
    [
      activities,
      tasks,
      addActivity,
      updateActivity,
      deleteActivity,
      getActivitiesByChannel,
      addTask,
      addBulkCarryOver,
      updateTask,
      removeTask,
      toggleTaskDone,
      getTasksByOwner,
      getTasksByChannel,
    ]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useActivityStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useActivityStore must be used within ActivityStoreProvider')
  return v
}
