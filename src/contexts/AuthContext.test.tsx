import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext.login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reject 잘못된 비밀번호 (QA-001 회귀)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    let resp: ReturnType<typeof result.current.login> | undefined
    act(() => {
      resp = result.current.login('ben@oh.com', 'wrong-password')
    })
    expect(resp).toEqual({ ok: false, reason: 'invalid' })
    expect(result.current.user).toBeNull()
  })

  it('정확한 demo 비밀번호 통과', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.login('ben@oh.com', 'demo')
    })
    expect(result.current.user?.email).toBe('ben@oh.com')
    expect(result.current.user?.role).toBe('team_member')
  })

  it('5회 연속 실패 시 30분 잠금 (TS-034)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    let last: ReturnType<typeof result.current.login> | undefined
    act(() => {
      for (let i = 0; i < 5; i++) last = result.current.login('ben@oh.com', 'wrong')
    })
    expect(last).toMatchObject({ ok: false, reason: 'invalid' })
    // 6번째 시도는 잠금 상태
    let resp: ReturnType<typeof result.current.login> | undefined
    act(() => {
      resp = result.current.login('ben@oh.com', 'demo')
    })
    expect(resp).toMatchObject({ ok: false, reason: 'locked' })
  })

  it('이메일 정규화: 대문자/공백 처리', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.login('  Ben@OH.COM ', 'demo')
    })
    expect(result.current.user?.email).toBe('ben@oh.com')
  })
})

describe('AuthContext.isAtLeast', () => {
  beforeEach(() => localStorage.clear())

  it('CEO는 director 이상 조건 만족', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('ceo@oh.com', 'demo'))
    expect(result.current.isAtLeast('director')).toBe(true)
    expect(result.current.isAtLeast('ceo')).toBe(true)
  })

  it('Team Member는 director 이상 조건 미만', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('ben@oh.com', 'demo'))
    expect(result.current.isAtLeast('director')).toBe(false)
    expect(result.current.isAtLeast('team_member')).toBe(true)
  })
})

describe('AuthContext.getAccessibleClientIds', () => {
  beforeEach(() => localStorage.clear())

  it('Director는 all 반환', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('director@oh.com', 'demo'))
    expect(result.current.getAccessibleClientIds()).toBe('all')
  })

  it('Team Member는 본인 assignedClients만', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('ben@oh.com', 'demo'))
    const ids = result.current.getAccessibleClientIds()
    expect(Array.isArray(ids) && ids.includes('c-trip')).toBe(true)
    expect(Array.isArray(ids) && ids.includes('c-mmt')).toBe(false) // Grace 담당
  })

  it('Part Manager는 본인 + 동일 partId 팀원 채널 (TS-NEW-009)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('partmgr@oh.com', 'demo'))
    const ids = result.current.getAccessibleClientIds()
    expect(Array.isArray(ids)).toBe(true)
    expect(ids).not.toBe('all')
    // 본인 담당 (c-trip, c-agoda) 포함
    expect((ids as string[]).includes('c-trip')).toBe(true)
  })
})

describe('AuthContext.logout', () => {
  beforeEach(() => localStorage.clear())

  it('logout 시 localStorage 클리어 + user null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('ben@oh.com', 'demo'))
    expect(result.current.user).not.toBeNull()
    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('sales-crm:auth-user')).toBeNull()
  })
})
