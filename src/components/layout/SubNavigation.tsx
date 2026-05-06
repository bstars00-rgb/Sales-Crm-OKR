import { NavLink, useLocation } from 'react-router'
import {
  Building2, GitBranch, Globe, MapPin, BarChart3, TrendingUp,
  FileSignature, Sparkles, CalendarDays, Target, Users as UsersIcon, AlertTriangle, FileBarChart,
  Sun, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubTab {
  to: string
  label: string
  icon: typeof Building2
}

interface SubGroup {
  parents: string[] // 매칭 경로 (TabNavigation matchPaths와 일관)
  groupLabel: string
  tabs: SubTab[]
}

const SUB_GROUPS: SubGroup[] = [
  {
    parents: ['/briefing', '/critical6', '/critical6/team'],
    groupLabel: 'Critical 6',
    tabs: [
      { to: '/briefing', label: '내 보드 (꾸미기)', icon: Sun },
      { to: '/critical6/team', label: '팀장 5분 점검', icon: ListChecks },
    ],
  },
  {
    parents: ['/crm', '/pipeline', '/hotels', '/destination', '/live-map'],
    groupLabel: 'CRM',
    tabs: [
      { to: '/crm', label: 'Channels', icon: Building2 },
      { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
      { to: '/hotels', label: 'Hotels', icon: Building2 },
      { to: '/destination', label: 'Destination', icon: Globe },
      { to: '/live-map', label: 'Live Map', icon: MapPin },
    ],
  },
  {
    parents: ['/performance', '/trends', '/reports'],
    groupLabel: 'Performance',
    tabs: [
      { to: '/performance', label: 'Monthly / Cascade', icon: BarChart3 },
      { to: '/trends', label: 'Trends (Market)', icon: TrendingUp },
      { to: '/reports', label: 'Custom Reports', icon: BarChart3 },
    ],
  },
  {
    parents: ['/contracts', '/decisions', '/calendar'],
    groupLabel: 'Workflow',
    tabs: [
      { to: '/contracts', label: 'Contracts', icon: FileSignature },
      { to: '/decisions', label: 'Decisions', icon: Sparkles },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    // Round 14 OKR Platform consumer
    parents: ['/okr', '/okr/my', '/okr/team', '/okr/bottleneck', '/okr/retro'],
    groupLabel: 'OKR',
    tabs: [
      { to: '/okr/my', label: 'My OKR', icon: Target },
      { to: '/okr/team', label: 'Team OKR', icon: UsersIcon },
      { to: '/okr/bottleneck', label: 'Bottleneck Chart', icon: AlertTriangle },
      { to: '/okr/retro', label: 'Quarter Retro', icon: FileBarChart },
    ],
  },
]

export default function SubNavigation() {
  const { pathname } = useLocation()
  const group = SUB_GROUPS.find((g) =>
    g.parents.some((p) => pathname === p || pathname.startsWith(p + '/'))
  )
  if (!group) return null

  return (
    <nav className="bg-muted/30 border-b border-border shrink-0">
      <div className="flex overflow-x-auto scrollbar-thin items-center px-4 gap-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mr-2 shrink-0">
          {group.groupLabel}
        </span>
        {group.tabs.map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-t shrink-0',
                'border-b-2 transition-colors -mb-px',
                isActive
                  ? 'border-primary text-primary bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
