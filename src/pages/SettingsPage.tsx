import { useState } from 'react'
import {
  User as UserIcon, Bell, Users, Plug, Target, CalendarRange,
  Layers, Shield, Settings as SettingsIcon, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/types'
import { mockUsers } from '@/mocks/users'
import { toast } from 'sonner'

type SubNavId =
  | 'profile' | 'notifications' | 'team' | 'integration'
  | 'kpi-target' | 'seasonality' | 'tier-weight' | 'audit-log'

type RoleGate = 'all' | 'manager' | 'director' | 'c_level'

interface SubNavDef {
  id: SubNavId
  label: string
  icon: typeof UserIcon
  gate: RoleGate
  hint?: string
}

const SUB_NAVS: SubNavDef[] = [
  { id: 'profile', label: '프로필', icon: UserIcon, gate: 'all' },
  { id: 'notifications', label: '알림', icon: Bell, gate: 'all' },
  { id: 'team', label: '팀 관리', icon: Users, gate: 'director', hint: 'Director+' },
  { id: 'integration', label: '통합 (API/SSO)', icon: Plug, gate: 'director', hint: 'Director+' },
  { id: 'kpi-target', label: 'KPI 목표', icon: Target, gate: 'c_level', hint: 'C-Level+' },
  { id: 'seasonality', label: '시즌성 (read-only)', icon: CalendarRange, gate: 'all', hint: 'SCM CRM 단일 소스' },
  { id: 'tier-weight', label: 'Tier 가중치', icon: Layers, gate: 'director', hint: 'Director+' },
  { id: 'audit-log', label: '감사 로그', icon: Shield, gate: 'director', hint: 'Director+' },
]

function gateOpen(gate: RoleGate, role?: string): boolean {
  if (gate === 'all') return true
  if (gate === 'manager') return ['team_manager', 'director', 'regional_director', 'c_level', 'ceo'].includes(role ?? '')
  if (gate === 'director') return ['director', 'regional_director', 'c_level', 'ceo'].includes(role ?? '')
  if (gate === 'c_level') return ['c_level', 'ceo'].includes(role ?? '')
  return false
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [active, setActive] = useState<SubNavId>('profile')
  const role = user?.role
  const activeDef = SUB_NAVS.find((n) => n.id === active)
  const accessible = activeDef ? gateOpen(activeDef.gate, role) : false

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          설정
        </h2>
        <p className="text-xs text-muted-foreground mt-1">FR-017 · 역할별 접근 제어</p>
      </div>

      <div className="flex gap-6">
        {/* Sub-nav */}
        <nav className="w-56 shrink-0">
          <ul className="space-y-1">
            {SUB_NAVS.map((n) => {
              const open = gateOpen(n.gate, role)
              const Icon = n.icon
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setActive(n.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors',
                      active === n.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-accent border border-transparent',
                      !open && 'opacity-60'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{n.label}</span>
                    {n.hint && (
                      <span className="text-[9px] text-muted-foreground">{n.hint}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {!accessible ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">접근 권한 없음</p>
              <p className="text-xs text-muted-foreground mt-1">
                이 항목은 {activeDef?.hint ?? '상위 권한'} 이상 접근 가능합니다.
              </p>
            </div>
          ) : (
            <ContentPanel id={active} />
          )}
        </div>
      </div>
    </div>
  )
}

function ContentPanel({ id }: { id: SubNavId }) {
  switch (id) {
    case 'profile':
      return <ProfilePanel />
    case 'notifications':
      return <NotificationsPanel />
    case 'team':
      return <TeamPanel />
    case 'integration':
      return <IntegrationPanel />
    case 'kpi-target':
      return <KPITargetPanel />
    case 'seasonality':
      return <SeasonalityPanel />
    case 'tier-weight':
      return <TierWeightPanel />
    case 'audit-log':
      return <AuditLogPanel />
    default:
      return null
  }
}

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground mb-4">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ProfilePanel() {
  const { user } = useAuth()
  return (
    <Section title="프로필" hint="개인 정보 및 직급">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="이름" value={user?.name ?? '-'} />
        <Field label="이메일" value={user?.email ?? '-'} />
        <Field label="직급" value={user ? ROLE_LABELS[user.role] : '-'} />
        <Field label="권역" value={user?.region ?? '-'} />
      </div>
      <button
        onClick={() => toast.info('온보딩 다시 보기 (Phase 2)')}
        className="h-8 px-3 text-xs rounded-md border border-border hover:bg-accent"
      >
        온보딩 다시 보기
      </button>
    </Section>
  )
}

function NotificationsPanel() {
  const categories = [
    { key: 'credit', label: 'Credit (한도/연체)', defaultOn: true },
    { key: 'booking', label: 'Booking (급증/급감)', defaultOn: true },
    { key: 'system', label: 'System (배포/장애)', defaultOn: false },
    { key: 'decision', label: 'Decision (5일+ 미결정)', defaultOn: true },
    { key: 'contract', label: 'Contract (만료 30일)', defaultOn: true },
  ]
  const [state, setState] = useState(Object.fromEntries(categories.map((c) => [c.key, c.defaultOn])))
  return (
    <Section title="알림 설정" hint="카테고리별 ON/OFF · 인앱 + 이메일 동시 적용">
      {categories.map((c) => (
        <label key={c.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <span className="text-sm">{c.label}</span>
          <button
            onClick={() => setState((s) => ({ ...s, [c.key]: !s[c.key] }))}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              state[c.key] ? 'bg-primary' : 'bg-muted'
            )}
            aria-label={`${c.label} 토글`}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform',
                state[c.key] ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>
      ))}
    </Section>
  )
}

function TeamPanel() {
  return (
    <Section title="팀 관리" hint="팀원 추가/삭제, PIC ↔ 채널 매핑">
      <p className="text-xs text-muted-foreground mb-2">현재 등록된 팀원 ({mockUsers.length}명)</p>
      <ul className="divide-y divide-border/50 border border-border rounded-md">
        {mockUsers.slice(0, 6).map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {u.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{u.name}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role]} · {u.email ?? '-'}</p>
            </div>
            <button
              onClick={() => toast.info(`${u.name} 편집 (Phase 2)`)}
              className="h-7 px-2 text-[11px] rounded border border-border text-muted-foreground hover:bg-accent"
            >
              편집
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function IntegrationPanel() {
  return (
    <Section title="통합 (API / SSO)" hint="RSS 피드 · Azure AD SSO · SCM CRM">
      <div className="grid grid-cols-1 gap-3 text-sm">
        <Toggle label="RSS 피드" status="연결됨" desc="6개 OTA · 마지막 갱신 23분 전" />
        <Toggle label="Azure AD SSO" status="연결됨" desc="OhMyHotel.onmicrosoft.com · OQ-001 결정" />
        <Toggle label="SCM CRM 시즌성" status="연결됨" desc="OQ-008 read-only · 매일 02:00 sync" />
      </div>
    </Section>
  )
}

function Toggle({ label, status, desc }: { label: string; status: string; desc: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
        <Check className="w-3 h-3" /> {status}
      </span>
    </div>
  )
}

function KPITargetPanel() {
  return (
    <Section title="KPI 연간 목표" hint="C-Level+ — 전사 OKR 입력">
      <div className="grid grid-cols-2 gap-3">
        <Field label="TTV 목표 (FY2026)" value="¥85,000,000,000" />
        <Field label="Revenue 목표" value="¥4,250,000,000" />
        <Field label="Ctrip% 목표" value="≤ 35%" />
        <Field label="China B2B%" value="≤ 65%" />
      </div>
    </Section>
  )
}

function SeasonalityPanel() {
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const weights = [0.085, 0.082, 0.090, 0.085, 0.078, 0.075, 0.072, 0.085, 0.090, 0.092, 0.088, 0.078]
  return (
    <Section title="시즌성 가중치 (read-only)" hint="OQ-008 · SCM CRM 단일 소스 · 매일 02:00 sync">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="text-left py-1">월</th>
            <th className="text-right py-1">가중치</th>
            <th className="text-right py-1 w-24">비중</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m, i) => (
            <tr key={m} className="border-t border-border/50">
              <td className="py-1">{m}</td>
              <td className="text-right tabular-nums">{(weights[i] * 100).toFixed(1)}%</td>
              <td>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${weights[i] * 1000}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground">
        편집은 SCM CRM에서만 가능합니다. 동시 편집 충돌 시 SCM 값 우선.
      </p>
    </Section>
  )
}

function TierWeightPanel() {
  return (
    <Section title="Tier 가중치" hint="OQ-007 · KPI Cascade L4-L5 가중 평균에 사용">
      <div className="grid grid-cols-3 gap-3">
        <WeightField label="Tier 1 (전략)" value={50} hint="채널 12개" />
        <WeightField label="Tier 2 (성장)" value={30} hint="채널 28개" />
        <WeightField label="Tier 3 (신규)" value={20} hint="채널 32개" />
      </div>
      <p className="text-[10px] text-muted-foreground">
        합계 100% 검증 — 100%가 아니면 저장 차단됩니다 (INPUT_002).
      </p>
    </Section>
  )
}

function WeightField({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-1">{value}%</p>
      <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
    </div>
  )
}

function AuditLogPanel() {
  const logs = [
    { ts: '2026-04-26 09:14', user: '이지현', action: 'SETTLEMENT_CHANGE_APPROVED', target: 'cc-008' },
    { ts: '2026-04-25 16:32', user: 'Jackie', action: 'KPI_TARGET_UPDATED', target: 'TTV/2026' },
    { ts: '2026-04-25 11:08', user: '김민수', action: 'TEAM_MEMBER_ADDED', target: 'u-new-001' },
    { ts: '2026-04-24 18:45', user: '이지현', action: 'SG_FLIP_APPROVED', target: 'sg-001' },
    { ts: '2026-04-24 10:20', user: '정태훈', action: 'TIER_WEIGHT_UPDATED', target: '50/30/20' },
  ]
  return (
    <Section title="감사 로그" hint="Director+ — 설정/승인 변경 이력 (최근 5건)">
      <ul className="divide-y divide-border/50 font-mono text-[11px]">
        {logs.map((l, i) => (
          <li key={i} className="py-1.5 flex items-center gap-3">
            <span className="text-muted-foreground tabular-nums">{l.ts}</span>
            <span className="font-medium">{l.user}</span>
            <span className="text-primary">{l.action}</span>
            <span className="text-muted-foreground truncate">{l.target}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border rounded-md p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1 truncate">{value}</p>
    </div>
  )
}
