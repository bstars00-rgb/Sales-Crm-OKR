import { NavLink, useLocation } from 'react-router'
import {
  Sun, LayoutDashboard, Users, Briefcase, BarChart3, FileText, FileSignature, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 7 핵심 탭 (16탭 → 7탭 압축, 2026-04-26)
// CRM / Performance / Workflow는 그룹 — 하위 라우트는 SubNavigation으로 표시
interface MainTab {
  to: string
  label: string
  icon: typeof Sun
  matchPaths?: string[] // 그룹 탭 활성 매칭 (sub-tab 포함)
}

const MAIN_TABS: MainTab[] = [
  { to: '/briefing', label: 'Critical 6', icon: Sun, matchPaths: ['/briefing', '/critical6'] },
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  {
    to: '/okr/my',
    label: 'OKR',
    icon: Target,
    matchPaths: ['/okr', '/okr/my', '/okr/team', '/okr/bottleneck', '/okr/retro'],
  },
  {
    to: '/crm',
    label: 'CRM',
    icon: Users,
    matchPaths: ['/crm', '/pipeline', '/hotels', '/destination', '/live-map'],
  },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
  {
    to: '/performance',
    label: 'Performance',
    icon: BarChart3,
    matchPaths: ['/performance', '/trends', '/reports'],
  },
  { to: '/weekly-brief', label: 'Weekly Brief', icon: FileText },
  {
    to: '/contracts',
    label: 'Workflow',
    icon: FileSignature,
    matchPaths: ['/contracts', '/decisions', '/calendar'],
  },
]

export default function TabNavigation() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-card border-b border-border shrink-0">
      <div className="flex overflow-x-auto scrollbar-thin">
        {MAIN_TABS.map(({ to, label, icon: Icon, matchPaths }) => {
          const isActive = matchPaths
            ? matchPaths.some((p) => p === pathname || pathname.startsWith(p + '/'))
            : to === '/'
            ? pathname === '/'
            : pathname === to || pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap',
                'border-b-2 transition-colors shrink-0',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
