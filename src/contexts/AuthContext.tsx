import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { ROLE_RANK } from '@/types'
import { mockUsers } from '@/mocks/users'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => { ok: true } | { ok: false; reason: 'invalid' | 'locked'; lockUntil?: number }
  logout: () => void
  switchRole: (role: UserRole) => void
  setOnboarded: () => void
  // 권한 헬퍼
  isAtLeast: (role: UserRole) => boolean
  canEditTier: boolean
  canEditKPITarget: boolean
  canInviteTeam: boolean
  canViewAllChannels: boolean
  canApproveContract: boolean
  canDecideAsCEO: boolean
  canPipelineRollback: boolean
  getAccessibleClientIds: () => string[] | 'all'
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'sales-crm:auth-user'
const ATTEMPT_KEY = 'sales-crm:login-attempts'

// FR-001 BR-001-2 데모 비밀번호 (모든 demo 사용자 공통). 실 환경은 bcrypt+백엔드.
const DEMO_PASSWORD = 'demo'

interface LoginAttempt {
  failCount: number
  lockUntil: number | null
}

function loadAttempts(email: string): LoginAttempt {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return all[email] ?? { failCount: 0, lockUntil: null }
  } catch {
    return { failCount: 0, lockUntil: null }
  }
}
function saveAttempts(email: string, attempt: LoginAttempt) {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[email] = attempt
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(all))
  } catch {}
}

// FR-001 BR-001-2 demo users — mocks/users.ts 단일 소스 사용 (TS3-005)
// Phase 1.5에서 Azure AD MSAL.js로 교체
const DEMO_USERS = mockUsers

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    return DEMO_USERS.find((u) => u.id === parsed.id) ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser)

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login: AuthContextType['login'] = (email, password) => {
    const normalizedEmail = email.toLowerCase().trim()
    const attempt = loadAttempts(normalizedEmail)
    const now = Date.now()
    if (attempt.lockUntil && now < attempt.lockUntil) {
      return { ok: false, reason: 'locked', lockUntil: attempt.lockUntil }
    }
    const found = DEMO_USERS.find((u) => u.email === normalizedEmail)
    if (!found || password !== DEMO_PASSWORD) {
      const nextFail = attempt.failCount + 1
      const lockUntil = nextFail >= 5 ? now + 30 * 60 * 1000 : null
      saveAttempts(normalizedEmail, { failCount: nextFail, lockUntil })
      return { ok: false, reason: 'invalid' }
    }
    // 성공 — 카운터 리셋
    saveAttempts(normalizedEmail, { failCount: 0, lockUntil: null })
    setUser(found)
    return { ok: true }
  }

  const logout = () => {
    const previousId = user?.id
    setUser(null)
    // BR-001-13 보안 데이터 클리어 — 다음 사용자 노출 방지
    localStorage.removeItem('sales-crm:recent-search')
    // PL-R3-008: 로그아웃한 사용자의 briefing-state / carryover-dismissed 키 정리
    if (previousId) {
      const prefix = `sales-crm:briefing-state:${previousId}:`
      const dismissPrefix = `sales-crm:carryover-dismissed:${previousId}:`
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k) continue
        if (k.startsWith(prefix) || k.startsWith(dismissPrefix)) keysToRemove.push(k)
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    }
    // ATTEMPT_KEY는 의도적으로 보존 (잠금 우회 차단). IT팀 리셋은 별도 API
  }

  const switchRole = (role: UserRole) => {
    const found = DEMO_USERS.find((u) => u.role === role)
    if (found) setUser(found)
  }

  const setOnboarded = () => {
    if (!user) return
    const updated = { ...user, onboardedAt: new Date().toISOString() }
    setUser(updated)
  }

  const isAtLeast = (role: UserRole) => {
    if (!user) return false
    return ROLE_RANK[user.role] >= ROLE_RANK[role]
  }

  const canEditTier = isAtLeast('director')
  const canEditKPITarget = isAtLeast('c_level')
  const canInviteTeam = isAtLeast('director')
  const canViewAllChannels = isAtLeast('director')
  const canApproveContract = isAtLeast('director')
  const canDecideAsCEO = isAtLeast('ceo')
  const canPipelineRollback = isAtLeast('director')

  const getAccessibleClientIds = (): string[] | 'all' => {
    if (!user) return []
    // Director 이상: 전체 / 권역 정책은 백엔드 단계에서 적용
    if (isAtLeast('director')) return 'all'
    // Team Manager: 본인 + 팀 (현 mock에서는 같은 region의 team_member)
    if (user.role === 'team_manager') {
      const teamIds = mockUsers
        .filter((u) => u.role === 'team_member' && u.region === user.region)
        .flatMap((u) => u.assignedClients ?? [])
      return Array.from(new Set([...(user.assignedClients ?? []), ...teamIds]))
    }
    // Part Manager: 본인 + 동일 partId 팀원 (BR-001-4, QA-002)
    if (user.role === 'part_manager' && user.partId) {
      const partIds = mockUsers
        .filter((u) => u.partId === user.partId && u.id !== user.id)
        .flatMap((u) => u.assignedClients ?? [])
      return Array.from(new Set([...(user.assignedClients ?? []), ...partIds]))
    }
    // Team Member: 본인 담당만
    return user.assignedClients ?? []
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        setOnboarded,
        isAtLeast,
        canEditTier,
        canEditKPITarget,
        canInviteTeam,
        canViewAllChannels,
        canApproveContract,
        canDecideAsCEO,
        canPipelineRollback,
        getAccessibleClientIds,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// 데모 페이지에서 직급 전환용 export
export const DEMO_USER_LIST = DEMO_USERS
