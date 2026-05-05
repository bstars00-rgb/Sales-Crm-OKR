import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Sun, Moon, Monitor, LogIn, Sparkles, BarChart3, Network, Globe } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth, DEMO_USER_LIST } from '@/contexts/AuthContext'
import { ROLE_LABELS, type LangCode } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const LANG_DEFS: { code: LangCode; flag: string; label: string; available: boolean }[] = [
  { code: 'ko', flag: '🇰🇷', label: '한국어', available: true },
  { code: 'en', flag: '🇺🇸', label: 'English', available: false },
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt', available: false },
]

const LANG_KEY = 'sales-crm:lang'

export default function LoginPage() {
  const { login, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lang, setLang] = useState<LangCode>(() => {
    try {
      return (localStorage.getItem(LANG_KEY) as LangCode) || 'ko'
    } catch {
      return 'ko'
    }
  })

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun

  // Round 10: 모든 직급이 로그인 후 Overview('/') 메인으로 라우팅
  if (user) {
    return <Navigate to="/" replace />
  }

  const selectLang = (code: LangCode) => {
    const def = LANG_DEFS.find((l) => l.code === code)
    if (!def?.available) {
      toast.info(`${def?.label} 지원 예정 — Phase 1.5에서 활성화`, {
        description: 'NFR-I18N-001 (3개 언어 지원). 현재 KR만 작동.',
      })
      return
    }
    setLang(code)
    try { localStorage.setItem(LANG_KEY, code) } catch {}
    toast.success(`${def.label}로 변경됨`)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 300))
    const result = login(email, password)
    if (!result.ok) {
      if (result.reason === 'locked' && result.lockUntil) {
        const mins = Math.ceil((result.lockUntil - Date.now()) / 60_000)
        setError(`5회 연속 실패로 ${mins}분간 잠금 — IT팀 문의`)
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다. (데모 비밀번호: demo)')
      }
      setSubmitting(false)
      return
    }
  }

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo')
    login(demoEmail, 'demo')
  }

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* AI + Tech 배경 */}
      <TechBackground />

      {/* Header */}
      <header className="relative z-10 h-14 px-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-background/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-sm">OH</span>
          </div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">OhMyHotel Channel Sales CRM</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 언어 토글 */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border/60 bg-background/40 backdrop-blur-sm">
            {LANG_DEFS.map((l) => (
              <button
                key={l.code}
                onClick={() => selectLang(l.code)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                  lang === l.code && l.available
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  !l.available && 'opacity-50'
                )}
                title={l.available ? `${l.label} (활성)` : `${l.label} — 추후 지원`}
              >
                <span className="text-sm leading-none">{l.flag}</span>
                <span className="hidden sm:inline">{l.code.toUpperCase()}</span>
                {!l.available && <span className="text-[8px]">·준비중</span>}
              </button>
            ))}
          </div>
          <button
            onClick={cycleTheme}
            className="p-2 rounded-md hover:bg-accent/50 transition-colors"
            title={`테마: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Body — 좌측 hero (3) / 우측 form (2) — 시원시원하게 */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] xl:grid-cols-[5fr_3fr] items-center px-6 sm:px-12 lg:px-20 xl:px-28 gap-12 lg:gap-16 xl:gap-24 py-10">
        {/* 좌측 Hero */}
        <section className="hidden lg:flex flex-col gap-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 backdrop-blur-sm text-sm text-indigo-200">
            <Sparkles className="w-4 h-4" />
            B2B Vertical SaaS · Round 9 (Option C)
          </div>

          <h2 className="text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight leading-[1.05] break-keep">
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
              데이터로 움직이는<br />
              <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent whitespace-nowrap">채널&nbsp;영업&nbsp;플랫폼</span>
            </span>
          </h2>

          <p className="text-xl xl:text-2xl text-foreground/85 leading-relaxed font-light max-w-2xl">
            30+ 글로벌 OTA / Wholesaler / TMC 채널을 한곳에서.<br />
            <span className="text-foreground/60 text-lg xl:text-xl">
              실시간 KPI 캐스케이드 · Opportunity 파이프라인<br />
              Win/Loss 분석 · 11타입 자동 알림
            </span>
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-2">
            <Stat icon={Globe} value="30+" label="글로벌 채널" />
            <Stat icon={Network} value="5단계" label="KPI 캐스케이드" />
            <Stat icon={BarChart3} value="6 Stage" label="Opportunity Funnel" />
          </div>

          {/* Tech Pills */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['React 19', 'TypeScript', 'Vite 8', 'TailwindCSS 4', 'Recharts', '7-rank RBAC', 'Real-time KPI'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-xs rounded-full border border-foreground/20 bg-background/30 backdrop-blur-sm text-foreground/70"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* 우측 Form — 더 큼직하게 */}
        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[520px] bg-card/85 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl shadow-indigo-500/20 p-10">
            <h2 className="text-2xl font-bold mb-1.5">로그인</h2>
            <p className="text-base text-muted-foreground mb-7">
              OMH 계정으로 Channel Sales CRM에 접속하세요.
            </p>

            {/* SSO Button */}
            <button
              type="button"
              disabled
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                'border border-border bg-background text-foreground/60',
                'cursor-not-allowed opacity-60'
              )}
              title="Phase 1.5에서 Azure AD SSO 활성화 예정"
            >
              <svg viewBox="0 0 23 23" className="w-4 h-4">
                <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
                <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
                <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
              </svg>
              <span className="text-sm font-medium">Microsoft 계정으로 로그인 (준비 중)</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">또는</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3" aria-label="로그인 폼">
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-foreground/80 mb-1">이메일</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@oh.com"
                  required
                  autoComplete="email"
                  aria-invalid={!!error}
                  className="w-full px-4 py-2.5 rounded-lg text-base bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-foreground/80 mb-1">비밀번호</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo"
                  required
                  autoComplete="current-password"
                  aria-invalid={!!error}
                  className="w-full px-4 py-2.5 rounded-lg text-base bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && (
                <div role="alert" className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-base hover:from-indigo-700 hover:to-cyan-600 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30"
              >
                <LogIn className="w-5 h-5" />
                {submitting ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* Demo Quick Login */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">데모 계정 빠른 로그인:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_USER_LIST.map((u) => {
                  const isAdmin = u.id === 'u-admin'
                  return (
                    <button
                      key={u.id}
                      onClick={() => quickLogin(u.email)}
                      className={cn(
                        'text-left px-2.5 py-1.5 rounded-md text-xs border transition-colors',
                        isAdmin
                          ? 'border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20'
                          : 'border-border hover:bg-accent'
                      )}
                    >
                      <div className="font-medium truncate flex items-center gap-1">
                        {isAdmin && <Sparkles className="w-3 h-3 text-indigo-500" />}
                        {u.name}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {isAdmin ? '시스템 관리자 (Admin)' : ROLE_LABELS[u.role]}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 py-4 text-xs text-muted-foreground text-center border-t border-white/10 backdrop-blur-md bg-background/30">
        OhMyHotel Channel Sales CRM • v0.1 (Phase 1) • Round 9 (Planner 10 / Tester 9.5) • <a href="mailto:it@oh.com" className="hover:underline">IT 문의</a>
      </footer>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Globe; value: string; label: string }) {
  return (
    <div className="bg-background/30 backdrop-blur-sm border border-border/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-4xl xl:text-5xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
        {value}
      </p>
    </div>
  )
}

// AI + Tech 테마 배경 — SVG 신경망 + 그라디언트 메시
function TechBackground() {
  return (
    <div className="absolute inset-0 -z-0 overflow-hidden">
      {/* 그라디언트 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900" />

      {/* 라이트 모드 fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-cyan-50 to-slate-100 dark:opacity-0 opacity-100 dark:hidden" />

      {/* 글로우 오브 — 좌상단 */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-40 dark:opacity-30"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />
      {/* 글로우 오브 — 우하단 */}
      <div
        className="absolute -bottom-32 -right-32 w-[700px] h-[700px] rounded-full blur-3xl opacity-30 dark:opacity-25"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
      />
      {/* 글로우 오브 — 중앙 */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
      />

      {/* 신경망 SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 dark:opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
      >
        <defs>
          <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#6366f1" opacity="0.5" />
          </pattern>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 도트 그리드 */}
        <rect width="1600" height="900" fill="url(#dot-grid)" />

        {/* 신경망 노드 + 연결선 (정적, demo용) */}
        {[
          { x: 150, y: 200 }, { x: 400, y: 150 }, { x: 700, y: 250 }, { x: 1000, y: 180 }, { x: 1350, y: 220 },
          { x: 250, y: 450 }, { x: 550, y: 400 }, { x: 850, y: 500 }, { x: 1150, y: 420 }, { x: 1450, y: 480 },
          { x: 180, y: 700 }, { x: 480, y: 750 }, { x: 800, y: 700 }, { x: 1100, y: 750 }, { x: 1400, y: 700 },
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="4" fill="#06b6d4" opacity="0.7">
              <animate attributeName="r" values="4;6;4" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={n.x} cy={n.y} r="12" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3">
              <animate attributeName="r" values="12;20;12" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {/* 연결 라인 (수직 + 수평) */}
        {[
          [150, 200, 400, 150], [400, 150, 700, 250], [700, 250, 1000, 180], [1000, 180, 1350, 220],
          [250, 450, 550, 400], [550, 400, 850, 500], [850, 500, 1150, 420],
          [400, 150, 250, 450], [700, 250, 550, 400], [1000, 180, 1150, 420],
          [180, 700, 480, 750], [480, 750, 800, 700], [800, 700, 1100, 750], [1100, 750, 1400, 700],
          [250, 450, 480, 750], [550, 400, 800, 700], [1150, 420, 1400, 700],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="url(#line-gradient)"
            strokeWidth="1.2"
            opacity="0.6"
          >
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${4 + (i % 3)}s`} repeatCount="indefinite" />
          </line>
        ))}
      </svg>

      {/* 노이즈 텍스처 (옵션) */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />
    </div>
  )
}
