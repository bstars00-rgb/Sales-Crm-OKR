import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ActivityStoreProvider, useActivityStore, resetActivityStoreCounters } from './ActivityStore'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActivityStoreProvider>{children}</ActivityStoreProvider>
    </AuthProvider>
  )
}

function useStoreWithAuth() {
  const auth = useAuth()
  const store = useActivityStore()
  return { auth, store }
}

describe('ActivityStore.addTask', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('user 없으면 null 반환 (R2-007)', () => {
    // 로그인하지 않은 상태에서 addTask 호출
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    expect(result.current.auth.user).toBeNull()
    let added: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      added = result.current.store.addTask({
        ownerUserId: 'unknown',
        date: '2026-04-25',
        category: 'NewDeal',
        title: 'X',
        status: 'Planned',
      })
    })
    expect(added).toBeNull()
  })

  it('정상 추가 시 빈 슬롯 rank 1 부여', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    let task: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      task = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date: '2026-12-31',
        category: 'NewDeal',
        title: 'New',
        status: 'Planned',
      })
    })
    expect(task).not.toBeNull()
    expect(task!.rank).toBe(1)
  })

  it('6개 초과 차단 (TC-R2-003)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    const date = '2026-12-30'
    act(() => {
      for (let i = 1; i <= 6; i++) {
        result.current.store.addTask({
          ownerUserId: 'u-tm',
          date,
          category: 'Internal',
          title: `Task ${i}`,
          status: 'Planned',
        })
      }
    })
    let seventh: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      seventh = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date,
        category: 'Internal',
        title: '7th',
        status: 'Planned',
      })
    })
    expect(seventh).toBeNull()
  })
})

describe('ActivityStore.removeTask rank 재정렬', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('중간 삭제 후 1..N 재정렬 (TC-R2-004 / QA-003)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    const date = '2026-12-29'
    const ids: string[] = []
    act(() => {
      for (let i = 1; i <= 3; i++) {
        const t = result.current.store.addTask({
          ownerUserId: 'u-tm',
          date,
          category: 'Internal',
          title: `T${i}`,
          status: 'Planned',
        })
        if (t) ids.push(t.id)
      }
    })
    // 중간 삭제 (rank 2)
    act(() => result.current.store.removeTask(ids[1]))
    const remaining = result.current.store.getTasksByOwner('u-tm', date).sort((a, b) => a.rank - b.rank)
    expect(remaining).toHaveLength(2)
    expect(remaining[0].rank).toBe(1)
    expect(remaining[1].rank).toBe(2)
  })
})

describe('ActivityStore.toggleTaskDone', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('Done 전환 시 Activity 자동 생성 + relatedTaskId 연결 (TC-R2-001 / QA-004)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    const beforeCount = result.current.store.activities.length
    let task: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      task = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date: '2026-12-28',
        channelId: 'c2',
        category: 'Promotion',
        title: 'Auto-activity test',
        status: 'Planned',
      })
    })
    expect(task).not.toBeNull()
    act(() => result.current.store.toggleTaskDone(task!.id))
    const updatedTask = result.current.store.tasks.find((t) => t.id === task!.id)
    expect(updatedTask?.status).toBe('Done')
    expect(updatedTask?.doneActivityIds?.length ?? 0).toBe(1)
    // 새 Activity가 생성됨
    expect(result.current.store.activities.length).toBe(beforeCount + 1)
    const created = result.current.store.activities.find((a) => a.relatedTaskId === task!.id)
    expect(created).toBeDefined()
    expect(created?.type).toBe('Promotion') // category 매핑
  })

  it('Done → InProgress 토글 시 5분 이내 자동 Activity 회수 (TC-R2-002 수정 / PL-R2-004)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    let task: ReturnType<typeof result.current.store.addTask> | undefined
    act(() => {
      task = result.current.store.addTask({
        ownerUserId: 'u-tm',
        date: '2026-12-27',
        category: 'Internal',
        title: 'Toggle test',
        status: 'Planned',
      })
    })
    // Done 전환 → Activity 자동 생성
    act(() => result.current.store.toggleTaskDone(task!.id))
    const countAfterDone = result.current.store.activities.length
    // 즉시 토글 해제 (5분 이내) → 자동 Activity 회수, 1개 줄어들어야 정상
    act(() => result.current.store.toggleTaskDone(task!.id))
    expect(result.current.store.activities.length).toBe(countAfterDone - 1)
    const updated = result.current.store.tasks.find((t) => t.id === task!.id)
    expect(updated?.status).toBe('InProgress')
    expect(updated?.doneActivityIds?.length ?? 0).toBe(0)
  })
})

describe('ActivityStore.addBulkCarryOver', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  // mockTasks가 'u-tm'(Ben)에 오늘 5개 시드 → Grace(u-grace) 사용으로 격리
  it('어제 미완료 일괄 → 오늘로 이월 (TS3-003 원자성)', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('grace@oh.com', 'demo'))
    const yesterday = '2026-12-26'
    const ids: string[] = []
    act(() => {
      for (let i = 1; i <= 2; i++) {
        const t = result.current.store.addTask({
          ownerUserId: 'u-grace',
          date: yesterday,
          category: 'Internal',
          title: `Yest ${i}`,
          status: 'Planned',
        })
        if (t) ids.push(t.id)
      }
    })
    let bulk: ReturnType<typeof result.current.store.addBulkCarryOver> | undefined
    act(() => {
      bulk = result.current.store.addBulkCarryOver(ids)
    })
    expect(bulk?.added).toBe(2)
    expect(bulk?.skipped).toBe(0)
  })

  it('6개 한도 초과 시 일부만 added 나머지 skipped', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('grace@oh.com', 'demo'))
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = '2026-12-25'
    const yIds: string[] = []
    act(() => {
      // 오늘 5개 미리 + 어제 3개 → 일괄 시 6번째 1개만 들어가고 2개 skip
      for (let i = 1; i <= 5; i++) {
        result.current.store.addTask({
          ownerUserId: 'u-grace',
          date: today,
          category: 'Internal',
          title: `Today ${i}`,
          status: 'Planned',
        })
      }
      for (let i = 1; i <= 3; i++) {
        const t = result.current.store.addTask({
          ownerUserId: 'u-grace',
          date: yesterday,
          category: 'Internal',
          title: `Yest ${i}`,
          status: 'Planned',
        })
        if (t) yIds.push(t.id)
      }
    })
    let bulk: ReturnType<typeof result.current.store.addBulkCarryOver> | undefined
    act(() => {
      bulk = result.current.store.addBulkCarryOver(yIds)
    })
    expect(bulk?.added).toBe(1)
    expect(bulk?.skipped).toBe(2)
  })
})

describe('ActivityStore Activity ops', () => {
  beforeEach(() => {
    localStorage.clear()
    resetActivityStoreCounters()
  })

  it('addActivity → updateActivity → deleteActivity 라이프사이클', () => {
    const { result } = renderHook(useStoreWithAuth, { wrapper })
    act(() => result.current.auth.login('ben@oh.com', 'demo'))
    let added: ReturnType<typeof result.current.store.addActivity> | undefined
    act(() => {
      added = result.current.store.addActivity({
        channelId: 'c2',
        authorUserId: 'u-tm',
        type: 'Email',
        occurredAt: new Date().toISOString(),
        subject: 'Test email',
        content: 'Body',
        source: 'manual',
      })
    })
    expect(added).toBeDefined()
    act(() => result.current.store.updateActivity(added!.id, { subject: 'Updated' }))
    const found = result.current.store.activities.find((a) => a.id === added!.id)
    expect(found?.subject).toBe('Updated')
    act(() => result.current.store.deleteActivity(added!.id))
    expect(result.current.store.activities.find((a) => a.id === added!.id)).toBeUndefined()
  })
})
