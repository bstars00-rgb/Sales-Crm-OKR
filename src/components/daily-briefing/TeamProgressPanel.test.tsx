import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ActivityStoreProvider } from '@/contexts/ActivityStore'
import { mockUsers } from '@/mocks/users'
import TeamProgressPanel from './TeamProgressPanel'
import type { ReactNode } from 'react'

// localStorage에 사용자 직접 주입 → AuthProvider 마운트 시 loadStoredUser로 동기 로드
function setStoredUser(email: string) {
  const u = mockUsers.find((m) => m.email === email)
  if (u) localStorage.setItem('sales-crm:auth-user', JSON.stringify(u))
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActivityStoreProvider>{children}</ActivityStoreProvider>
    </AuthProvider>
  )
}

describe('TeamProgressPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Team Member 권한은 패널 렌더 X (null 반환)', () => {
    setStoredUser('ben@oh.com')
    const { container } = render(<TeamProgressPanel />, { wrapper: Wrapper })
    expect(container.textContent).not.toMatch(/팀원 진척률/)
  })

  it('Team Manager는 같은 region 팀원 표시', () => {
    setStoredUser('teammgr@oh.com')
    render(<TeamProgressPanel />, { wrapper: Wrapper })
    expect(screen.queryByText(/팀원 진척률/)).toBeInTheDocument()
    // EA region team_members: Ben Park, Grace Kim
    expect(screen.queryByText(/Ben Park/)).toBeInTheDocument()
    expect(screen.queryByText(/Grace Kim/)).toBeInTheDocument()
  })

  it('Director는 모든 team_member 표시', () => {
    setStoredUser('director@oh.com')
    render(<TeamProgressPanel />, { wrapper: Wrapper })
    expect(screen.queryByText(/팀원 진척률/)).toBeInTheDocument()
    // Ben/Grace/Jane/Jasmine 모두
    expect(screen.queryByText(/Ben Park/)).toBeInTheDocument()
    expect(screen.queryByText(/Jane Lee/)).toBeInTheDocument()
    expect(screen.queryByText(/Jasmine Choi/)).toBeInTheDocument()
  })

  it('Part Manager는 동일 partId 팀원만 (TS-NEW-009)', () => {
    setStoredUser('partmgr@oh.com')
    render(<TeamProgressPanel />, { wrapper: Wrapper })
    expect(screen.queryByText(/팀원 진척률/)).toBeInTheDocument()
    // Ben(part-ea-1) 포함, 다른 partId 없는 팀원은 미포함
    expect(screen.queryByText(/Ben Park/)).toBeInTheDocument()
    // Jane은 SEA, partId 없음 → 미포함
    expect(screen.queryByText(/Jane Lee/)).not.toBeInTheDocument()
  })
})
